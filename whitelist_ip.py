"""
whitelist_ip.py - Programmatically add your IP to MongoDB Atlas Network Access
using the Atlas Admin API with Digest authentication.

Usage:
    python whitelist_ip.py <PUBLIC_KEY> <PRIVATE_KEY> <GROUP_ID>

To get these from Atlas:
  1. Go to https://cloud.mongodb.com
  2. Organization → Access Manager → API Keys → Create API Key
  3. Your Group/Project ID is in the URL: cloud.mongodb.com/v2/<GROUP_ID>#/...

Alternatively run with --allow-all to whitelist 0.0.0.0/0 (all IPs).
"""
import sys
import json
import urllib.request
import urllib.parse
import hashlib
import time
import os
import re


def get_public_ip():
    try:
        return urllib.request.urlopen("https://api.ipify.org", timeout=5).read().decode()
    except Exception:
        return None


def digest_auth_request(url, public_key, private_key, method="GET", body=None):
    """Make a Digest-authenticated request to the Atlas Admin API."""
    import hashlib, time, random, string, ssl

    ctx = ssl.create_default_context()

    # Step 1: unauthenticated request to get the WWW-Authenticate header
    req = urllib.request.Request(url, method=method)
    if body:
        req.add_header("Content-Type", "application/json")
        req.data = json.dumps(body).encode()

    try:
        urllib.request.urlopen(req, context=ctx, timeout=10)
    except urllib.error.HTTPError as e:
        if e.code != 401:
            raise
        www_auth = e.headers.get("WWW-Authenticate", "")
    except Exception as e:
        raise RuntimeError(f"Connection error: {e}")

    # Parse digest params
    realm = re.search(r'realm="([^"]+)"', www_auth)
    nonce = re.search(r'nonce="([^"]+)"', www_auth)
    if not realm or not nonce:
        raise RuntimeError(f"Could not parse WWW-Authenticate: {www_auth}")

    realm = realm.group(1)
    nonce = nonce.group(1)
    nc = "00000001"
    cnonce = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    uri = urllib.parse.urlparse(url).path

    ha1 = hashlib.md5(f"{public_key}:{realm}:{private_key}".encode()).hexdigest()
    ha2 = hashlib.md5(f"{method}:{uri}".encode()).hexdigest()
    response_hash = hashlib.md5(
        f"{ha1}:{nonce}:{nc}:{cnonce}:auth:{ha2}".encode()
    ).hexdigest()

    auth_header = (
        f'Digest username="{public_key}", realm="{realm}", nonce="{nonce}", '
        f'uri="{uri}", nc={nc}, cnonce="{cnonce}", response="{response_hash}", '
        f'qop=auth'
    )

    # Step 2: authenticated request
    req2 = urllib.request.Request(url, method=method)
    req2.add_header("Authorization", auth_header)
    req2.add_header("Accept", "application/json")
    if body:
        req2.add_header("Content-Type", "application/json")
        req2.data = json.dumps(body).encode()

    try:
        resp = urllib.request.urlopen(req2, context=ctx, timeout=10)
        return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Atlas API error {e.code}: {e.read().decode()}")


def whitelist_ip(public_key, private_key, group_id, ip_address="0.0.0.0/0", comment="Allow all"):
    url = f"https://cloud.mongodb.com/api/atlas/v1.0/groups/{group_id}/accessList"
    body = [{"ipAddress": ip_address, "comment": comment}]
    result = digest_auth_request(url, public_key, private_key, method="POST", body=body)
    return result


if __name__ == "__main__":
    print("=" * 60)
    print("MongoDB Atlas IP Whitelist Tool")
    print("=" * 60)

    public_ip = get_public_ip()
    print(f"\nYour current public IP: {public_ip or 'Could not detect'}")

    if len(sys.argv) < 4:
        print("\n❌ Usage: python whitelist_ip.py <PUBLIC_KEY> <PRIVATE_KEY> <GROUP_ID>")
        print("\nTo get your Atlas API keys:")
        print("  1. Go to https://cloud.mongodb.com")
        print("  2. Click your Organization name → Access Manager")
        print("  3. Click 'API Keys' tab → 'Create API Key'")
        print("  4. Give it 'Project Owner' role")
        print("  5. Your Group/Project ID is visible in the Atlas URL")
        print("     e.g. cloud.mongodb.com/v2/<YOUR_GROUP_ID>#/")
        print(f"\nAlternatively, manually add this IP in Atlas Network Access:")
        print(f"  IP to add: {public_ip or '???'}")
        print(f"  Or use: 0.0.0.0/0  (allows all IPs — easiest for development)")
        sys.exit(1)

    public_key = sys.argv[1]
    private_key = sys.argv[2]
    group_id = sys.argv[3]
    ip_to_add = sys.argv[4] if len(sys.argv) > 4 else "0.0.0.0/0"

    print(f"\nAdding {ip_to_add} to Atlas project {group_id}...")
    try:
        result = whitelist_ip(public_key, private_key, group_id, ip_to_add)
        print(f"✅ Success! IP whitelisted: {json.dumps(result, indent=2)}")
    except Exception as e:
        print(f"❌ Failed: {e}")
