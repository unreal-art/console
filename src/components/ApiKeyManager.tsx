import React, { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Key,
  Calendar,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient, ApiKey as ApiKeyDto } from "@/lib/api"

interface ApiKeyRow extends ApiKeyDto {
  calls: number
  updatedAt: number
  wallet: string
  paymentToken: string
}

interface ApiKeyManagerProps {
  isAuthenticated: boolean
  onCreateKey?: (key: string) => void
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  isAuthenticated,
  onCreateKey,
}) => {
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyLimit, setNewKeyLimit] = useState<number | undefined>()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchApiKeys = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.listApiKeys()
      // Normalize response to typed ApiKey array
      const normalized: ApiKeyDto[] = response.keys || []

      // Deduplicate by hash to avoid React key warnings
      const dedupedMap = new Map<string, ApiKeyDto>()
      normalized.forEach((k) => {
        if (k.hash) {
          dedupedMap.set(k.hash, k)
        }
      })

      const dedupedArray = Array.from(dedupedMap.values())

      setApiKeys(
        dedupedArray.map(
          (k: ApiKeyDto): ApiKeyRow => ({
            ...k,
            calls: 0,
            updatedAt: k.created_at
              ? new Date(k.created_at).getTime() / 1000
              : 0,
            wallet: "",
            paymentToken: "",
          })
        )
      )

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch API keys",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Fetch API keys on component mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchApiKeys()
    }
  }, [isAuthenticated, fetchApiKeys])

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await apiClient.createApiKey(newKeyName)
      setCreatedKey(response.key)
      setNewKeyName("")
      setNewKeyLimit(undefined)
      setIsCreateDialogOpen(false)
      await fetchApiKeys() // Refresh the list
      onCreateKey?.(response.key)
      toast({
        title: "Success",
        description: "API key created successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const deleteApiKey = async (keyHash: string) => {
    try {
      await apiClient.deleteApiKey(keyHash)
      await fetchApiKeys() // Refresh the list
      toast({
        title: "Success",
        description: "API key deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string, keyHash: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(keyHash)
    setTimeout(() => setCopiedKey(null), 2000)
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    })
  }

  const toggleKeyVisibility = (keyHash: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(keyHash)) {
      newVisibleKeys.delete(keyHash)
    } else {
      newVisibleKeys.add(keyHash)
    }
    setVisibleKeys(newVisibleKeys)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const maskKey = (key?: string) => {
    if (!key || key.length <= 8) return key || ""
    return `${key.substring(0, 4)}${"*".repeat(key.length - 8)}${key.substring(key.length - 4)}`
  }

  if (!isAuthenticated) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <Key className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold mb-2">Connect Wallet First</h3>
          <p className="text-slate-400">
            Please connect your wallet to manage API keys
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-slate-400">
            Create and manage your API keys for accessing Unreal AI services
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key to access Unreal AI services
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="keyLimit">Usage Limit (Optional)</Label>
                <Input
                  id="keyLimit"
                  type="number"
                  value={newKeyLimit || ""}
                  onChange={(e) =>
                    setNewKeyLimit(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="Leave empty for no limit"
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createApiKey}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {isCreating ? "Creating..." : "Create Key"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Created Key Display */}
      {createdKey && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-900/20 border border-green-700 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-green-400 mb-2">
            API Key Created Successfully!
          </h3>
          <p className="text-sm text-slate-300 mb-3">
            Please copy your API key now. You won't be able to see it again.
          </p>
          <div className="flex items-center space-x-2 bg-slate-800 p-3 rounded border">
            <code className="flex-1 text-sm font-mono text-green-400">
              {createdKey}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(createdKey, "new-key")}
              className="text-green-400 hover:text-green-300"
            >
              {copiedKey === "new-key" ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCreatedKey(null)}
            className="mt-2 text-slate-400"
          >
            Dismiss
          </Button>
        </motion.div>
      )}

      {/* API Keys Table */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Your API Keys
          </CardTitle>
          <CardDescription>
            Manage your existing API keys and monitor their usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading API keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
              <p className="text-slate-400 mb-4">
                You haven't created any API keys yet
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key, index) => (
                  <TableRow key={key.hash ?? index} className="border-slate-700">
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm font-mono bg-slate-800 px-2 py-1 rounded">
                          {visibleKeys.has(key.hash)
                            ? key.hash
                            : maskKey(key.hash)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleKeyVisibility(key.hash)}
                          className="text-slate-400 hover:text-white"
                        >
                          {visibleKeys.has(key.hash) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(key.hash, key.hash)}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedKey === key.hash ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span>{key.calls} calls</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{formatDate(key.updatedAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the API key "{key.name}"?
                              This action cannot be undone and will immediately revoke
                              access for any applications using this key.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-slate-600">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteApiKey(key.hash)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Key
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ApiKeyManager
