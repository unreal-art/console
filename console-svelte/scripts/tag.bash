#!/bin/bash



tag=$(git tag --points-at HEAD)

if [ "$tag" ];then
  # echo "tag $tag"
  x=1
else
  tag1=$(git describe --tags --abbrev=0 $(git rev-list --tags --max-count=1 --first-parent) 2>/dev/null)
  tag1=$(git tag --list --merged | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$' | sort -V | tail -n 1)
  # echo "tag1 $tag1"
  head_commit_hash=$(git rev-parse --short HEAD)
  # tag=$tag1-$head_commit_hash 
  #FIXME: its too much
  tag=$tag1
fi

# echo "tag $tag"
echo "export TAG=$tag"




# # Get the latest tag
# tag1=$(git describe --tags --abbrev=0 $(git rev-list --tags --max-count=1 --first-parent) 2>/dev/null)


# # Check if latest tag was found
# if [ -z "$latest_tag" ]; then
#     echo "No tags found in the repository."
#     exit 1
# fi

# # Get the full commit hash of the HEAD
# head_commit_hash=$(git rev-parse HEAD)

# # Ensure the head commit hash was found
# if [ -z "$head_commit_hash" ]; then
#     echo "Could not determine the HEAD commit hash."
#     exit 1
# fi

# # Check if the latest tag is the same as the HEAD commit
# if [ "$(git rev-parse "$latest_tag")" == "$head_commit_hash" ]; then
#     echo "Latest tag is the HEAD commit."
# else
#     # Output the latest tag followed by "-headcommit"
#     echo "${latest_tag}-${head_commit_hash:0:7}"
# fi
