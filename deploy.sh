bunx grats
bun run relay
bun run bundler 
docker buildx build --platform linux/arm64 -t registry.avohome/meal-plan -f build.Dockerfile . --push 
kubectl delete -f deploy-k3s.yaml
kubectl apply -f deploy-k3s.yaml