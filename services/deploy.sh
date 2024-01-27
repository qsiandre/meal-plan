docker buildx build --platform linux/arm64 -t registry.avohome/meal-ranker -f Dockerfile . --push
kubectl delete -f deploy-k3s.yaml
kubectl apply -f deploy-k3s.yaml