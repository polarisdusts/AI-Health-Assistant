import os
base = r"C:\Users\23378\Documents\text1\frontend"
files = ["index.html", "src/App.vue", "src/main.js", "src/views/Dashboard.vue", "src/components/AppLayout.vue"]
for f in files:
    path = os.path.join(base, f)
    with open(path, "rb") as fh:
        raw = fh.read()
    has_bom = raw[:3] == b"\xef\xbb\xbf"
    import chardet
    result = chardet.detect(raw[:2000])
    print("{}: encoding={}, confidence={:.2f}, bom={}".format(f, result["encoding"], result["confidence"], has_bom))
