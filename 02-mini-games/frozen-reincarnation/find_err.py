with open(r"D:\Project\02-mini-games\frozen-reincarnation\_check.js", "r", encoding="utf-8") as f:
    js = f.read()

# Track brace depth, ignoring strings and comments
depth = 0
in_str = None
in_template = 0
i = 0
line = 1
errors = []
while i < len(js):
    c = js[i]
    if c == "\n":
        line += 1
        in_str = None if in_str == "\n" else in_str
        i += 1
        continue
    if in_str:
        if c == "\\" and i+1 < len(js):
            i += 2
            continue
        if c == in_str:
            in_str = None
        i += 1
        continue
    # Skip line comments
    if c == "/" and i+1 < len(js) and js[i+1] == "/":
        while i < len(js) and js[i] != "\n":
            i += 1
        continue
    # Skip block comments
    if c == "/" and i+1 < len(js) and js[i+1] == "*":
        i += 2
        while i < len(js)-1 and not (js[i] == "*" and js[i+1] == "/"):
            if js[i] == "\n": line += 1
            i += 1
        i += 2
        continue
    if c in ('"', "'"):
        in_str = c
        i += 1
        continue
    if c == "`":
        in_template += 1
        i += 1
        continue
    if in_template % 2 == 1:
        if c == "\\" and i+1 < len(js):
            i += 2
            continue
        i += 1
        continue
    if c == "{":
        depth += 1
    elif c == "}":
        depth -= 1
        if depth < 0:
            errors.append(f"Extra }} at line {line}")
            depth = 0
    i += 1

print(f"Final brace depth: {depth}")
print(f"Errors: {errors}")
