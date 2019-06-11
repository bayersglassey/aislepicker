. ip.sh
ssh "root@$IP" 'cd /home/aislepicker/aislepicker && nohup python -m SimpleHTTPServer 80 1>>log 2>&1 &'
