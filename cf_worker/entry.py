from urllib.parse import urlparse

async def on_fetch(request, env):
    # Get the full URL from request.url and parse it
    url = request.url
    parsed_url = urlparse(url)
    path = parsed_url.path  # Extract the path component

    if path.startswith("/access/"):
        key = path[len("/access/"):]
        bucket = env.my_r2_bucket
        response = await bucket.get(key)
        if response.status == 200:
            csv_content = await response.text()
            return Response(csv_content)
        else:
            return Response("File not found", status=404)
    else:
        return Response("Invalid path", status=404)