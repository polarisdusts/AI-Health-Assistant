import os
base = r"C:\Users\23378\Documents\text1\frontend"
files = ["index.html", "src/App.vue", "src/main.js", "src/views/Dashboard.vue", "src/views/Login.vue"]
for f in files:
    path = os.path.join(base, f)
    with open(path, "rb") as fh:
        raw = fh.read()
    has_bom = raw[:3] == b"\xef\xbb\xbf"
    is_utf8 = True
    try:
        raw.decode("utf-8")
    except:
        is_utf8 = False
    # Check if it has Chinese chars properly
    has_chinese = b"\xe4" in raw or b"\xe5" in raw
    print("{}: utf8={}, bom={}, has_chinese={}, size={}".format(f, is_utf8, has_bom, has_chinese, len(raw)))
    if is_utf8:
        text = raw.decode("utf-8")
        # Find first occurrence of Chinese characters
        for i, ch in enumerate(text):
            if ord(ch) > 127:
                context = text[max(0,i-5):i+5]
                print("  First non-ASCII at char {}: ...{}...".format(i, repr(context)))
                break
