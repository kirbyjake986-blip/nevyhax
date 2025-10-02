/* setText.js - Updates data/giveaway.json in the GitHub repo via GitHub API.
   Expects POST JSON: { admin: 'nevhax1', text: 'New Text' }
   Requires env vars:
   - GITHUB_REPO
   - GITHUB_TOKEN
   - ADMIN_KEY (the same secret you use in the admin URL)
*/
exports.handler = async function(event, context) {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const adminKey = process.env.ADMIN_KEY || 'nevhax1';
  const path = 'data/giveaway.json';

  if(!repo || !token){
    return { statusCode: 500, body: JSON.stringify({message: 'Server not configured'}) };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    if(!body || body.admin !== adminKey){
      return { statusCode: 401, body: JSON.stringify({message: 'Unauthorized'}) };
    }
    const newText = body.text || 'Free Account Giveaway';

    // Get current file to obtain SHA (if exists)
    const getUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
    let getRes = await fetch(getUrl, { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } });
    let sha = null;
    if(getRes.status === 200){
      const json = await getRes.json();
      sha = json.sha;
    }

    const content = Buffer.from(JSON.stringify({ text: newText })).toString('base64');
    const putBody = {
      message: 'Update giveaway text via admin panel',
      content: content
    };
    if(sha) putBody.sha = sha;

    const putRes = await fetch(getUrl, {
      method: 'PUT',
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
      body: JSON.stringify(putBody)
    });
    const putJson = await putRes.json();
    if(!putRes.ok){
      return { statusCode: putRes.status, body: JSON.stringify({ message: putJson.message || 'Failed to update' }) };
    }
    return { statusCode: 200, body: JSON.stringify({ message: 'Updated' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: String(err) }) };
  }
};
