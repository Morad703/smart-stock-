$files = Get-ChildItem -Path "c:\Users\ADmiN\Downloads\vf\vf\k8s" -Recurse -Filter "*.yaml"
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    if ($content -match "image:") {
        $newContent = [regex]::Replace($content, "(?m)^(\s*-\s*name:\s*)([a-zA-Z0-9-]+)\r?\n(\s*image:\s*)[^\r\n]+", "${1}${2}
${3}HARBOR_IP/smartstock/${2}:1.0")
        Set-Content -Path $f.FullName -Value $newContent -Encoding UTF8
    }
}
