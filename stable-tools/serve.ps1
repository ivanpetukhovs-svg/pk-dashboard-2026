param(
  [int]$Port = 8098,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$root = Join-Path (Split-Path -Parent $PSScriptRoot) "app"
$rootFull = [System.IO.Path]::GetFullPath($root)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $Port)

function Get-ContentType {
  param([string]$Path)

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8"; break }
    ".css" { "text/css; charset=utf-8"; break }
    ".js" { "application/javascript; charset=utf-8"; break }
    ".json" { "application/json; charset=utf-8"; break }
    ".svg" { "image/svg+xml"; break }
    ".png" { "image/png"; break }
    ".jpg" { "image/jpeg"; break }
    ".jpeg" { "image/jpeg"; break }
    ".webp" { "image/webp"; break }
    ".pdf" { "application/pdf"; break }
    ".docx" { "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; break }
    ".pptx" { "application/vnd.openxmlformats-officedocument.presentationml.presentation"; break }
    ".woff" { "font/woff"; break }
    ".woff2" { "font/woff2"; break }
    default { "application/octet-stream"; break }
  }
}

function Send-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$Status,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType = "text/plain; charset=utf-8",
    [bool]$HeadOnly = $false
  )

  $header = "HTTP/1.1 $Status $StatusText`r`n" +
    "Content-Type: $ContentType`r`n" +
    "Content-Length: $($Body.Length)`r`n" +
    "Cache-Control: no-store`r`n" +
    "Connection: close`r`n`r`n"

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if (-not $HeadOnly -and $Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

function Send-Text {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$Status,
    [string]$StatusText,
    [string]$Text,
    [bool]$HeadOnly = $false
  )

  $body = [System.Text.Encoding]::UTF8.GetBytes($Text)
  Send-Response -Stream $Stream -Status $Status -StatusText $StatusText -Body $body -HeadOnly $HeadOnly
}

try {
  $listener.Start()
} catch {
  Write-Host "Could not start the local server on port $Port."
  Write-Host "The port may be busy. Close another dashboard copy or contact the release owner."
  throw
}

$url = "http://127.0.0.1:$Port/"
Write-Host "Local stable dashboard is running:"
Write-Host $url
Write-Host "Keep this window open while the dashboard is in use."
if (-not $NoBrowser) {
  Start-Process $url
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
      $requestLine = $reader.ReadLine()

      while ($true) {
        $line = $reader.ReadLine()
        if ($null -eq $line -or $line -eq "") { break }
      }

      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        Send-Text -Stream $stream -Status 400 -StatusText "Bad Request" -Text "Bad Request"
        continue
      }

      $parts = $requestLine.Split(" ")
      if ($parts.Count -lt 2) {
        Send-Text -Stream $stream -Status 400 -StatusText "Bad Request" -Text "Bad Request"
        continue
      }

      $method = $parts[0].ToUpperInvariant()
      $headOnly = $method -eq "HEAD"
      if ($method -ne "GET" -and -not $headOnly) {
        Send-Text -Stream $stream -Status 405 -StatusText "Method Not Allowed" -Text "Method Not Allowed" -HeadOnly $headOnly
        continue
      }

      $pathOnly = ($parts[1] -split "\?")[0]
      $decoded = [System.Uri]::UnescapeDataString($pathOnly).TrimStart("/")
      if ([string]::IsNullOrWhiteSpace($decoded)) {
        $decoded = "index.html"
      }

      $decoded = $decoded -replace "/", [System.IO.Path]::DirectorySeparatorChar
      $filePath = [System.IO.Path]::GetFullPath((Join-Path $rootFull $decoded))

      if (-not $filePath.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        Send-Text -Stream $stream -Status 403 -StatusText "Forbidden" -Text "Forbidden" -HeadOnly $headOnly
        continue
      }

      if ([System.IO.Directory]::Exists($filePath)) {
        $filePath = Join-Path $filePath "index.html"
      }

      if (-not [System.IO.File]::Exists($filePath)) {
        Send-Text -Stream $stream -Status 404 -StatusText "Not Found" -Text "Not Found" -HeadOnly $headOnly
        continue
      }

      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      Send-Response -Stream $stream -Status 200 -StatusText "OK" -Body $bytes -ContentType (Get-ContentType -Path $filePath) -HeadOnly $headOnly
    } catch {
      try {
        Send-Text -Stream $stream -Status 500 -StatusText "Internal Server Error" -Text "Internal Server Error"
      } catch {}
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
