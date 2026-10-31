path = "/etc/nginx/conf.d/budibase.conf"
with open(path, "r") as f:
    content = f.read()

# Replace the gobudibase location block to add index index.html;
old_block = """    location ^~ /gobudibase/ {
        alias /var/www/gobudibase/;
        try_files $uri $uri/ /gobudibase/index.html;
        add_header Cache-Control "no-store";
        gzip_static on;
    }"""

new_block = """    location ^~ /gobudibase/ {
        alias /var/www/gobudibase/;
        index index.html;
        try_files $uri $uri/ /gobudibase/index.html;
        add_header Cache-Control "no-store";
        gzip_static on;
    }"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(path, "w") as f:
        f.write(content)
    print("Added index index.html to /gobudibase/ location")
else:
    print("old_block not found")
