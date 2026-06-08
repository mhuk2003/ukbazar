"""
UK BAZAR - HTTPS Local Server
دووجار کلیک بکە بۆ کراوەکردنی سایت
"""
import os, sys, socket, threading, webbrowser, subprocess, time

PORT = 5000
script_dir = os.path.dirname(os.path.abspath(sys.argv[0]))

def try_install(pkg):
    subprocess.call([sys.executable,'-m','pip','install',pkg,'-q'])

def start_https():
    try_install('cryptography')
    import http.server, ssl, tempfile, ipaddress, datetime
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    os.chdir(script_dir)
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, u'localhost')])
    cert = (x509.CertificateBuilder()
        .subject_name(name).issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.utcnow())
        .not_valid_after(datetime.datetime.utcnow()+datetime.timedelta(days=730))
        .add_extension(x509.SubjectAlternativeName([
            x509.DNSName(u'localhost'),
            x509.IPAddress(ipaddress.IPv4Address('127.0.0.1'))
        ]),critical=False)
        .sign(key, hashes.SHA256()))

    td = tempfile.mkdtemp()
    cf = os.path.join(td,'c.pem'); kf = os.path.join(td,'k.pem')
    with open(cf,'wb') as f: f.write(cert.public_bytes(serialization.Encoding.PEM))
    with open(kf,'wb') as f: f.write(key.private_bytes(serialization.Encoding.PEM,
        serialization.PrivateFormat.TraditionalOpenSSL, serialization.NoEncryption()))

    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(cf, kf)
    httpd = http.server.HTTPServer(('127.0.0.1', PORT), http.server.SimpleHTTPRequestHandler)
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
    return httpd, f'https://localhost:{PORT}', True

def start_http():
    import http.server
    os.chdir(script_dir)
    httpd = http.server.HTTPServer(('127.0.0.1', PORT), http.server.SimpleHTTPRequestHandler)
    return httpd, f'http://localhost:{PORT}', False

print('\n  UK BAZAR Server بارئەکات...\n')
try:
    httpd, url, is_https = start_https()
    cam = '✅ کامێرا کارئەکات'
except Exception as e:
    print(f'  ⚠️  HTTPS نەبوو ({e})\n  HTTP کراوەدەبێت...')
    httpd, url, is_https = start_http()
    cam = '⚠️  کامێرا پێویستی بە HTTPS هەیە'

print(f"""
╔══════════════════════════════════════╗
║       UK BAZAR سێرڤەر کراوەبوو      ║
╠══════════════════════════════════════╣
║  🌐  {url:<33}║
║  📷  {cam:<33}║
╠══════════════════════════════════════╣
║  داخستن: ئەم پەنجەرەیە داببخە       ║
╚══════════════════════════════════════╝
""")

# براوزەر کراوەبکە
def open_browser():
    time.sleep(1.0)
    webbrowser.open(url)
threading.Thread(target=open_browser, daemon=True).start()

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print('\n✅ داخرا')
