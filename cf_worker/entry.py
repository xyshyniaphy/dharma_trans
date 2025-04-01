import csv
from io import StringIO
import json

async def on_fetch(request, env):
    path = request.path
    if path.startswith("/access/"):
        key = path[len("/access/"):]
        bucket = env.my_r2_bucket
        response = await bucket.get(key)
        if response.status == 200:
            csv_content = await response.text()
            csv_file = StringIO(csv_content)
            reader = csv.DictReader(csv_file)
            data = list(reader)
            json_data = json.dumps(data)
            return Response(
                json_data,
                headers={"Content-Type": "application/json"},
            )
        else:
            return Response("File not found", status=404)
    else:
        return Response("Invalid path", status=404)