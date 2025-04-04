// Function to get file from R2 bucket
async function getFileFromR2(env, path) {
    try {
      const parts = path.split("/");
      const key = parts[parts.length - 1];
      if (!key) {
        return new Response("No file key provided", { status: 400 });
      }
      return await getFileFromR2ByKey(env, key);
    } catch (error) {
      return new Response(`Failed to access file: ${error.message} ${path}`, { status: 500 });
    }
  }

async function getTextFromR2ByKey(env, key) {

    const object = await env.MY_R2_BUCKET.get(key);
    if (object) {
        const content = await object.text();
        return content;
    }
    return null;
}
async function getFileFromR2ByKey(env, key) {
    try {
        return new Response(await getTextFromR2ByKey(env,key));
    } catch (error) {
        return new Response(`Failed to access file: ${error.message} ${key}`, { status: 500 });
    }
}

export { getFileFromR2, getFileFromR2ByKey , getTextFromR2ByKey};