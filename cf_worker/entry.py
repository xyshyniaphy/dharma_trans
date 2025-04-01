async def on_fetch(request, env):
    path = request.path
    if path.startswith("/access/"):
        key = path[len("/access/"):]
        bucket = env.my_r2_bucket
        response = await bucket.get(key)
        if response.status == 200:
            content = await response.text()
            return Response(content)
        else:
            return Response("File not found", status=404)
    else:
        return Response("Invalid path", status=404)