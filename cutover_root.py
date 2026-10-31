path = "/etc/nginx/conf.d/budibase.conf"
with open(path, "r") as f:
    content = f.read()

old_root = """    location = / {
        proxy_pass http://127.0.0.1:4001;
        proxy_set_header X-Forwarded-Proto $scheme;
    }"""

new_root = """    location = / {
        return 302 /gobudibase/;
    }"""

if old_root in content:
    content = content.replace(old_root, new_root)
    with open(path, "w") as f:
        f.write(content)
    print("Updated root / location to redirect to /gobudibase/")
else:
    print("old_root not found or already redirected")
