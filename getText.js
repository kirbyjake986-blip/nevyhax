/* getText.js - Returns the current giveaway text stored in the repo file via GitHub API.
   Requires environment variables set in Netlify:
   - GITHUB_REPO  (owner/repo)
   - GITHUB_TOKEN (personal access token with repo permissions)
*/
exports.handler = async function(event, context) {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const path = 'data/giveaway.json';
  if(!repo || !token){
    return { statusCode: 500, body: JSON.stringify({message: 'Server not configured'}) };
  }
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3.raw' } });
    if(!res.ok) {
      // If file not found, return default
      if(res.status === 404) return { statusCode: 200, body: JSON.stringify({ text: 'Free Account Giveaway' }) };
      return { statusCode: res.status, body: JSON.stringify({ message: 'GitHub API error' }) };
    }
    const json = await res.json();
    // when Accept raw is used, content is raw; but GitHub may still return JSON; handle both
    let text = 'Free Account Giveaway';
    if(typeof json === 'string') {
      try { const parsed = JSON.parse(json); text = parsed.text || text; } catch(e){ text = json; }
    } else if(json && json.content){
      const buff = Buffer.from(json.content, 'base64');
      const parsed = JSON.parse(buff.toString());
      text = parsed.text || text;
    } else if(json && json.text){
      text = json.text;
    }
    return { statusCode: 200, body: JSON.stringify({ text }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: String(err) }) };
  }
};
