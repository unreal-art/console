lastTag=$(git describe --tags --abbrev=0 --match 'v[0-9]*.[0-9]*.[0-9]*' --exclude '*-*')
echo "lastTag is $lastTag"
git log $lastTag..HEAD --oneline