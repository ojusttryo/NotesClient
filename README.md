# Notes
The WEB UI for Notes


To handle all URLs Apache config should contain next rows in <VirtualHost *:%httpsport%> section:

RewriteEngine On
RewriteRule ^/index.php$ /index.php [L]
RewriteRule ^.*(/[a-zA-Z0-9]+.js)$ $1 [L]
RewriteRule ^.*(/[a-zA-Z0-9]+.css)$ $1 [L]
RewriteRule ^.*(/[a-zA-Z0-9]+.svg)$ /img$1 [L]
RewriteCond %{REQUEST_URI} !=/index.php
RewriteRule ^.*$ /index.php [L]

MongoDB *.conf file should contain:

security.authorization: enabled

And there should be at least one user in database