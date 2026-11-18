param(
    [switch]$RequireAllLive
)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptDir) { $ScriptDir = (Get-Location).Path }
$ProjectRoot = Split-Path -Parent $ScriptDir
$TempDir = [System.IO.Path]::GetTempPath()
$CurlBin = if (Get-Command curl.exe -ErrorAction SilentlyContinue) { "curl.exe" } else { "curl" }
$OutDir = Join-Path $ProjectRoot "data"
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
$OutJsPath = Join-Path $OutDir "c2c_vehicles_data.js"

$NowKst = [DateTimeOffset]::UtcNow.ToOffset([TimeSpan]::FromHours(9))
$TodayDate = $NowKst.ToString("yyyy-MM-dd")
$UpdatedAtStr = $NowKst.ToString("yyyy-MM-dd HH:mm:ss")
$CollectedAtStr = $NowKst.ToString("yyyy-MM-dd HH:mm")

Write-Host "[$UpdatedAtStr] Starting K Car x All-C2C 4-Platform Dataset Build..." -ForegroundColor Cyan

# ==============================================================================
# 0. Load Previous Dataset & Trend KPIs (Graceful Fallback Baseline)
# ==============================================================================
$prevMeta = $null
$prevVehicles = @()
if (Test-Path $OutJsPath) {
    try {
        $rawJs = [System.IO.File]::ReadAllText($OutJsPath, [System.Text.Encoding]::UTF8)
        $mMeta = [regex]::Match($rawJs, 'window\.KCAR_ALL_C2C_META\s*=\s*(\{[\s\S]*?\});\s*window\.KCAR_ALL_C2C_VEHICLES')
        if ($mMeta.Success) { $prevMeta = $mMeta.Groups[1].Value | ConvertFrom-Json }
        $mVeh = [regex]::Match($rawJs, 'window\.KCAR_ALL_C2C_VEHICLES\s*=\s*(\[[\s\S]*\]);\s*$')
        if ($mVeh.Success) {
            $parsedVeh = $mVeh.Groups[1].Value | ConvertFrom-Json
            $prevVehicles = if ($parsedVeh -is [System.Array]) { $parsedVeh } elseif ($null -ne $parsedVeh) { @($parsedVeh) } else { @() }
        }
        Write-Host "   Loaded previous baseline: $($prevVehicles.Count) vehicles." -ForegroundColor DarkGray
    } catch {
        Write-Warning "Could not parse previous c2c_vehicles_data.js: $_"
    }
}

if ($env:GITHUB_ACTIONS -eq "true" -and $prevMeta -and $prevMeta.crawledDate -eq $TodayDate -and [int]$prevMeta.livePlatformsCount -ge 4) {
    Write-Host "[$UpdatedAtStr] Today's complete 4/4 Korean-IP dataset ($TodayDate) is already present. Skipping partial Cloud overwrite." -ForegroundColor Cyan
    exit 0
}

$latestTrend = $null
try {
    $tsCache = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $trendArr = Invoke-RestMethod -Uri "https://raw.githubusercontent.com/JisuKim-pokju82/c2c-car-trend-tracker/main/competitor_trend.json?t=$tsCache" -TimeoutSec 15 -ErrorAction Stop
    if ($trendArr) { $latestTrend = @($trendArr)[-1] }
} catch {
    $localTrendPath = Join-Path (Join-Path (Split-Path -Parent $ProjectRoot) "당근") "competitor_trend.json"
    if (Test-Path $localTrendPath) {
        try {
            $trendArr = [System.IO.File]::ReadAllText($localTrendPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
            if ($trendArr) { $latestTrend = @($trendArr)[-1] }
        } catch {}
    }
}

function Infer-Fuel([string]$title, [string]$rawFuel) {
    if ($rawFuel -and $rawFuel.Trim() -ne "") {
        if ($rawFuel -match "하이브리드|HEV|전기\+가솔린|가솔린\+전기") { return "하이브리드" }
        if ($rawFuel -match "전기|EV") { return "전기" }
        if ($rawFuel -match "디젤|경유") { return "디젤" }
        if ($rawFuel -match "LPG|LPI") { return "LPG" }
        if ($rawFuel -match "가솔린|휘발유") { return "가솔린" }
        return $rawFuel
    }
    if ($title -match "하이브리드|HEV|300h|350h|450h|250h") { return "하이브리드" }
    if ($title -match "전기|EV3|EV6|EV9|아이오닉\s*5|아이오닉\s*6|모델\s*[3YXS]|타이칸|EQ[A-Z]") { return "전기" }
    if ($title -match "디젤|TDI|2\.2D|2\.0D|\b\d{3}d\b|30d|40d|220d|320d|520d|S350d|렉스턴|모하비|카니발\s*R|봉고|포터") { return "디젤" }
    if ($title -match "LPG|LPI|렌터카|택시") { return "LPG" }
    return "가솔린"
}

function Infer-BodyType([string]$title) {
    $t = $title.ToUpper()
    if ($t -match "SUV|RV|쏘렌토|싼타페|스포티지|투싼|카니발|팰리세이드|셀토스|니로|코나|모하비|티볼리|토레스|렉스턴|코란도|QM6|XM3|트랙스|트레일블레이저|올란도|베뉴|GV60|GV70|GV80|아이오닉5|아이오닉 5|EV3|EV6|EV9|모델Y|모델 Y|모델X|모델 X|카이엔|마칸|X1|X2|X3|X4|X5|X6|X7|GLA|GLB|GLC|GLE|GLS|Q2|Q3|Q5|Q7|Q8|티구안|투아렉|XC40|XC60|XC90|레니게이드|체로키|랭글러|디스커버리|레인지로버|익스플로러|컨트리맨|이쿼녹스|콜로라도") { return "SUV·RV" }
    if ($t -match "모닝|스파크|레이|캐스퍼|마티즈|다마스|라보|엑센트|프라이드|클릭|베르나|미니|쿠퍼") { return "경차·소형" }
    if ($t -match "아반떼|K3|포르테|크루즈|라세티|SM3|벨로스터|I30|골프|제타|A3|1시리즈|2시리즈|시빅|프리우스") { return "준중형" }
    if ($t -match "쏘나타|소나타|K5|말리부|SM6|SM5|I40|G70|3시리즈|320|4시리즈|C클래스|C200|C220|A4|A5|파사트|아테온|S60|캠리|어코드|모델3|모델 3|아이오닉6|아이오닉 6") { return "중형세단" }
    if ($t -match "스타리아|스타렉스|포터|봉고|마스터|쏠라티|카운티|마이티|트럭|화물|캠핑카|밴|냉동탑") { return "상용·승합" }
    if ($t -match "그랜저|K7|K8|K9|G80|G90|EQ900|제네시스|에쿠스|체어맨|오피러스|아슬란|알페온|임팔라|SM7|5시리즈|520|530|6시리즈|7시리즈|E클래스|E200|E220|E250|E300|E350|S클래스|CLS|A6|A7|A8|파나메라|타이칸|911|박스터|카이맨|모델S|모델 S|S90") { return "준대형·대형" }
    return "중형세단"
}

function Normalize-Sido([string]$rawRegion) {
    if (-not $rawRegion) { return "기타" }
    foreach ($k in @("서울","경기","인천","부산","대구","대전","광주","울산","세종","강원","충북","청북","충남","청남","전북","전남","경북","경남","제주")) {
        if ($rawRegion -like "*$k*") {
            if ($k -eq "청북") { return "충북" }
            if ($k -eq "청남") { return "충남" }
            return $k
        }
    }
    return "기타"
}

function Get-PriceBand([int]$p) {
    if ($p -lt 1000) { return "1천만원 미만" }
    if ($p -lt 2000) { return "1천~2천만원" }
    if ($p -lt 3000) { return "2천~3천만원" }
    if ($p -lt 5000) { return "3천~5천만원" }
    return "5천만원 이상"
}

function Calc-AvgPrice([object[]]$items, [int]$fallback) {
    $valid = @($items | Where-Object { [int]$_.priceManwon -gt 0 -and [int]$_.priceManwon -lt 50000 })
    if ($valid.Count -eq 0) { return $fallback }
    $sum = 0
    foreach ($v in $valid) { $sum += [int]$v.priceManwon }
    return [int][math]::Round($sum / $valid.Count)
}

$livePlatforms = New-Object System.Collections.Generic.List[string]
$seenIds = @{}

# ==============================================================================
# A. K Car 안심직거래 (Live Total Count + Full Thumbnail Enumeration)
# ==============================================================================
Write-Host "1. Collecting K Car Safe Direct Deal vehicles..." -ForegroundColor Yellow
function Encrypt-KCarParam([string]$jsonText) {
    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    $aes.Key = [System.Text.Encoding]::UTF8.GetBytes("SKFJ2424DasfaJRI")
    $aes.IV  = [System.Text.Encoding]::UTF8.GetBytes("sfq241sf3dscs321")
    $encBytes = $aes.CreateEncryptor().TransformFinalBlock([System.Text.Encoding]::UTF8.GetBytes($jsonText), 0, [System.Text.Encoding]::UTF8.GetByteCount($jsonText))
    return [Convert]::ToBase64String($encBytes)
}
function Invoke-KCarJson([string]$uri, [string]$paramJson) {
    $body = @{ enc = (Encrypt-KCarParam $paramJson) } | ConvertTo-Json -Compress
    $resp = Invoke-WebRequest -Uri $uri -Method Post -ContentType "application/json" -Body $body -UseBasicParsing -TimeoutSec 25 -ErrorAction Stop
    $sr = New-Object System.IO.StreamReader($resp.RawContentStream, [System.Text.Encoding]::UTF8)
    $s = $sr.ReadToEnd(); $sr.Close()
    return ($s | ConvertFrom-Json)
}

$kcarLiveTotal = 0
$kcarMap = @{}
$kcarItems = New-Object System.Collections.Generic.List[object]

try {
    $cntRes = Invoke-KCarJson "https://market-api.kcar.com/api/v1/ds/carSearchListCount" '{"wr_eq_sell_dcd":"ALL","countFlag":true}'
    if ($cntRes -and $cntRes.data -and $cntRes.data.totalCnt) {
        $kcarLiveTotal = [int]$cntRes.data.totalCnt
    }
    for ($idx = 1; $idx -le 60; $idx += 9) {
        $r = Invoke-KCarJson "https://market-api.kcar.com/api/v1/ds/pagingCarSearchList" "{`"componentId`":`"DS-0044-001-002`",`"index`":$idx,`"orderBy`":`"iqy_dt:desc`",`"orderFlag`":true}"
        if (-not $r.data -or $r.data.Count -eq 0) { break }
        foreach ($it in $r.data) { if ($it.ccCarId) { $kcarMap[$it.ccCarId] = $it } }
    }
    for ($idx = 1; $idx -le 360; $idx += 20) {
        $r = Invoke-KCarJson "https://market-api.kcar.com/api/v1/ds/pagingCarSearchList" "{`"componentId`":`"DS-0044-002-002`",`"index`":$idx,`"orderBy`":`"iqy_dt:desc`",`"orderFlag`":true}"
        if (-not $r.data -or $r.data.Count -eq 0) { break }
        foreach ($it in $r.data) { if ($it.ccCarId) { $kcarMap[$it.ccCarId] = $it } }
    }
} catch { Write-Warning "KCar API warning: $_" }

foreach ($it in $kcarMap.Values) {
    $id = "kcar_" + $it.ccCarId
    if ($seenIds.ContainsKey($id)) { continue }

    $imgs = @()
    if ($it.thumbnails) {
        $imgs = @($it.thumbnails -split '\|' | Where-Object { $_ -and $_ -like "http*" })
    }
    if ($imgs.Count -eq 0 -and $it.mainThumbnail) { $imgs = @($it.mainThumbnail) }
    if ($imgs.Count -eq 0) { continue }

    $prc = [int]$it.salprc
    if ($prc -le 0) { continue }
    $seenIds[$id] = $true

    $locParts = ($it.sidosigungu -split '\|')
    $detailLoc = if ($locParts.Count -ge 2) { ($locParts[1] -replace '특별시|광역시|특별자치시|특별자치도','').Trim() } else { ($locParts[0] -replace ' 전체','').Trim() }
    $sido = Normalize-Sido $it.sidosigungu

    $yrStr = [string]$it.regModelyr
    $fstDt = [string]$it.fstRegDt
    $yrLabel = if ($fstDt.Length -ge 6) { "$($fstDt.Substring(2,2))년 $([int]$fstDt.Substring(4,2))월" } else { "$($yrStr)년형" }

    $opts = @()
    if ($it.optnNm) {
        $opts = @($it.optnNm -split '\|' | Select-Object -First 8)
    }
    $origin = if ($it.mnuftrNm -match "현대|기아|제네시스|쉐보레|르노|쌍용|KG") { "국산" } else { "수입" }

    $kcarItems.Add([ordered]@{
        id = $id
        carId = [string]$it.ccCarId
        platform = "kcar"
        platformLabel = "K Car 안심직거래"
        isExternal = $false
        origin = $origin
        brand = [string]$it.mnuftrNm
        model = [string]$it.modelNm
        title = ([string]$it.carWhlNm).Trim()
        year = [int]$yrStr
        yearLabel = $yrLabel
        mileageKm = [int]$it.milg
        fuel = Infer-Fuel $it.carWhlNm $it.fuelNm
        bodyType = Infer-BodyType $it.carWhlNm
        priceManwon = $prc
        priceBand = Get-PriceBand $prc
        sido = $sido
        region = $detailLoc
        plateNo = [string]$it.cno
        avatarUrl = [string]$it.carImgUrl
        thumbnail = $imgs[0]
        images = $imgs
        diagYn = ($it.drvgYn -eq "Y" -or $it.wrntyYn -eq "Y" -or $it.premium -eq "Y")
        negoYn = ($it.priceOfferYn -eq "Y")
        ownerComment = if ($it.ownerComment) { [string]$it.ownerComment } else { "실소유자 인증이 완료된 K Car 안심직거래 매물입니다." }
        options = $opts
        tags = @("실소유자 인증", $(if ($it.priceOfferYn -eq "Y") { "가격제안가능" } else { "정찰가 판매" }), "직거래 안전결제 가능")
        extrColor = if ($it.extrColorNm) { [string]$it.extrColorNm } else { "화이트 계열" }
        intrColor = if ($it.intrColorNm) { [string]$it.intrColorNm } else { "블랙 계열" }
        transmission = if ($it.gboxNm) { [string]$it.gboxNm } else { "오토" }
        wishCount = [int]$it.likeCount
        chatCount = [int]$it.chatCount
        status = if ($it.sellStat -and $it.sellStat -ne "") { "예약중" } else { "판매중" }
        collectedAt = $CollectedAtStr
        outUrl = "https://marketm.kcar.com/ds/detail/adInfoDtl/$($it.ccCarId)"
    })
}

if ($kcarItems.Count -gt 0) {
    $livePlatforms.Add("kcar")
    Write-Host "   K Car live count: $($kcarItems.Count) (Market Total: $kcarLiveTotal)" -ForegroundColor Green
} else {
    $prevKcar = @($prevVehicles | Where-Object { $_.platform -eq "kcar" })
    foreach ($pv in $prevKcar) { $kcarItems.Add($pv) }
    Write-Warning "   K Car live returned 0; preserved $($kcarItems.Count) previous K Car items."
}

# ==============================================================================
# B. 당근마켓 중고차 (Live Sitemap Count + 20 Regional Hubs 5-Photo Galleries)
# ==============================================================================
Write-Host "2. Collecting Daangn Used Cars..." -ForegroundColor Yellow
$daangnLiveTotal = 0
try {
    $tempGz = Join-Path $TempDir "daangn_sm_$($PID).xml.gz"
    & $CurlBin -s -L --max-time 25 -A "Mozilla/5.0" "https://www.daangn.com/kr/cars/sitemap-detail.xml.gz" -o $tempGz
    if ((Test-Path $tempGz) -and (Get-Item $tempGz).Length -gt 100) {
        $fs = [System.IO.File]::OpenRead($tempGz)
        $gz = New-Object System.IO.Compression.GZipStream($fs, [System.IO.Compression.CompressionMode]::Decompress)
        $sr = New-Object System.IO.StreamReader($gz, [System.Text.Encoding]::UTF8)
        $xmlContent = $sr.ReadToEnd()
        $sr.Close(); $gz.Close(); $fs.Close()
        Remove-Item $tempGz -Force -ErrorAction SilentlyContinue
        $daangnLiveTotal = [regex]::Matches($xmlContent, '<loc>https://www\.daangn\.com/kr/cars/([^<]+?)/?</loc>').Count
    }
} catch { Write-Warning "Daangn sitemap warning: $_" }

$daangnHubs = @(
    @{ id="6035"; sido="서울"; gu="강남구" }, @{ id="6128"; sido="서울"; gu="서초구" },
    @{ id="6188"; sido="서울"; gu="송파구" }, @{ id="6052"; sido="서울"; gu="강서구" },
    @{ id="230";  sido="서울"; gu="마포구" }, @{ id="355";  sido="서울"; gu="성동구" },
    @{ id="1573"; sido="경기"; gu="성남시 분당구" }, @{ id="1291"; sido="경기"; gu="수원시 영통구" },
    @{ id="1339"; sido="경기"; gu="용인시 수지구" }, @{ id="4416"; sido="경기"; gu="화성시" },
    @{ id="4719"; sido="경기"; gu="고양시 일산동구" }, @{ id="1420"; sido="경기"; gu="부천시" },
    @{ id="6543"; sido="인천"; gu="연수구" }, @{ id="6026"; sido="부산"; gu="해운대구" },
    @{ id="5663"; sido="대구"; gu="수성구" }, @{ id="5793"; sido="대전"; gu="유성구" },
    @{ id="1015"; sido="광주"; gu="서구" }, @{ id="1201"; sido="울산"; gu="남구" },
    @{ id="3478"; sido="경남"; gu="창원시" }, @{ id="3835"; sido="제주"; gu="제주시" }
)

$daangnItems = New-Object System.Collections.Generic.List[object]
foreach ($hub in $daangnHubs) {
    try {
        $sess = New-Object Microsoft.PowerShell.Commands.WebRequestSession
        Invoke-WebRequest -Uri "https://www.daangn.com/kr/api/v1/regions/search-region" -Method Post -ContentType "application/json" -Body "{`"regionId`":`"$($hub.id)`"}" -WebSession $sess -UseBasicParsing -TimeoutSec 15 -ErrorAction SilentlyContinue | Out-Null
        $resp = Invoke-WebRequest -Uri "https://www.daangn.com/kr/search/cars/" -WebSession $sess -UseBasicParsing -TimeoutSec 20 -ErrorAction SilentlyContinue
        if (-not $resp -or -not $resp.RawContentStream) { continue }
        $sr = New-Object System.IO.StreamReader($resp.RawContentStream, [System.Text.Encoding]::UTF8)
        $rawHtml = $sr.ReadToEnd(); $sr.Close()
        $m = [regex]::Match($rawHtml, 'window\.__remixContext\s*=\s*(\{.*?\});\s*</script>')
        if ($m.Success) {
            $obj = $m.Groups[1].Value | ConvertFrom-Json
            $posts = $obj.state.loaderData.'routes/kr.search.cars._index'.carPosts
            $hubAdded = 0
            foreach ($p in $posts) {
                if ($hubAdded -ge 45) { break }
                if ($p.status -ne "ON_SALE" -and $p.status -ne "RESERVED") { continue }
                $slug = ($p.id -replace '^/kr/cars/|/$', '')
                $id = "daangn_" + $slug
                if ($seenIds.ContainsKey($id)) { continue }
                $prc = [int]$p.price
                if ($prc -le 50 -or $p.type -eq "RENTAL" -or $p.type -eq "LEASE") { continue }
                $imgs = @()
                if ($p.images) {
                    foreach ($im in $p.images) {
                        $imgs += ($im -replace 's=1440x1440','s=720x720')
                    }
                }
                if ($imgs.Count -eq 0) { continue }
                $seenIds[$id] = $true

                $cName = ([string]$p.carData.carName).Trim()
                $origin = if ($cName -match "현대|기아|제네시스|그랜저|아반떼|쏘나타|싼타페|투싼|팰리세이드|캐스퍼|코나|스타리아|아이오닉|카니발|쏘렌토|스포티지|레이|모닝|셀토스|니로|모하비|K3|K5|K7|K8|K9|EV3|EV6|EV9|G70|G80|G90|GV60|GV70|GV80|스파크|말리부|트랙스|트레일블레이저|크루즈|티볼리|렉스턴|코란도|토레스|체어맨|SM3|SM5|SM6|SM7|QM3|QM5|QM6|XM3|봉고|포터") { "국산" } else { "수입" }
                $brand = if ($cName -match "기아|카니발|쏘렌토|스포티지|레이|모닝|셀토스|니로|모하비|K3|K5|K7|K8|K9|EV3|EV6|EV9|봉고") { "기아" }
                         elseif ($cName -match "제네시스|G70|G80|G90|GV60|GV70|GV80|EQ900") { "제네시스" }
                         elseif ($cName -match "스파크|말리부|트랙스|트레일블레이저|크루즈|이쿼녹스|콜로라도") { "쉐보레" }
                         elseif ($cName -match "티볼리|렉스턴|코란도|토레스|체어맨") { "KG모빌리티" }
                         elseif ($cName -match "SM3|SM5|SM6|SM7|QM3|QM5|QM6|XM3") { "르노코리아" }
                         elseif ($origin -eq "국산") { "현대" }
                         elseif ($cName -match "시리즈|X[1-7]|미니|쿠퍼") { "BMW" }
                         elseif ($cName -match "클래스|GL[A-S]|CLS|AMG") { "벤츠" }
                         elseif ($cName -match "A[3-8]|Q[2-8]") { "아우디" }
                         elseif ($cName -match "모델\s*[3YXS]") { "테슬라" }
                         elseif ($cName -match "카이엔|마칸|파나메라|911|타이칸|박스터") { "포르쉐" }
                         elseif ($cName -match "골프|티구안|파사트|아테온|제타") { "폭스바겐" }
                         elseif ($cName -match "XC[469]0|S[69]0") { "볼보" }
                         elseif ($cName -match "ES|NX|RX|LS|UX") { "렉서스" }
                         else { "수입차" }

                $yr = [int]$p.carData.modelYear
                $yrShort = if ($yr -ge 2000) { ($yr % 100).ToString("00") + "년형" } else { "$($yr)년형" }
                $dong = if ($p.region.name) { "$($hub.sido) $($p.region.name)" } else { "$($hub.sido) $($hub.gu)" }

                $daangnItems.Add([ordered]@{
                    id = $id
                    carId = $slug
                    platform = "daangn"
                    platformLabel = "당근마켓 직거래"
                    isExternal = $true
                    origin = $origin
                    brand = $brand
                    model = (($cName -split '\s+')[0..([Math]::Min(1, ($cName -split '\s+').Count - 1))] -join ' ')
                    title = $cName
                    year = $yr
                    yearLabel = $yrShort
                    mileageKm = [int]$p.driveDistance
                    fuel = Infer-Fuel $cName ""
                    bodyType = Infer-BodyType $cName
                    priceManwon = $prc
                    priceBand = Get-PriceBand $prc
                    sido = $hub.sido
                    region = $dong
                    plateNo = "외부직거래"
                    avatarUrl = ""
                    thumbnail = $imgs[0]
                    images = @($imgs | Select-Object -First 5)
                    diagYn = $false
                    negoYn = $true
                    ownerComment = "당근마켓 동네 인증 차주가 직접 등록한 개인 직거래 매물입니다. 상세 옵션 및 차주 채팅은 원본 페이지에서 확인하세요."
                    options = @("개인 직거래", "동네인증 차주", "당근중고차 등록")
                    tags = @("당근마켓 수집", "개인 판매자", "수수료 0원 직거래")
                    extrColor = "원본 페이지 확인"
                    intrColor = "원본 페이지 확인"
                    transmission = "오토"
                    wishCount = [int]$p.voteCount
                    chatCount = [int]$p.chatRoomCount
                    viewCount = [int]$p.viewCount
                    status = if ($p.status -eq "RESERVED") { "예약중" } else { "판매중" }
                    collectedAt = $CollectedAtStr
                    outUrl = "https://www.daangn.com$($p.href)"
                })
                $hubAdded++
            }
        }
    } catch {}
}

if ($daangnItems.Count -gt 0) {
    $livePlatforms.Add("daangn")
    if ($daangnItems.Count -lt 600 -and $prevVehicles.Count -gt 0) {
        $prevDaangnExtra = @($prevVehicles | Where-Object { $_.platform -eq "daangn" })
        foreach ($pv in $prevDaangnExtra) {
            if ($daangnItems.Count -ge 900) { break }
            if (-not $seenIds.ContainsKey($pv.id)) {
                $seenIds[$pv.id] = $true
                $daangnItems.Add($pv)
            }
        }
    }
    Write-Host "   Daangn live count: $($daangnItems.Count) (Market Total: $daangnLiveTotal)" -ForegroundColor Green
} else {
    $prevDaangn = @($prevVehicles | Where-Object { $_.platform -eq "daangn" })
    foreach ($pv in $prevDaangn) { $daangnItems.Add($pv) }
    Write-Warning "   Daangn live returned 0; preserved $($daangnItems.Count) previous Daangn items."
}

# ==============================================================================
# C. 엔카닷컴 개인직거래 (Separation.A — Live Count + Multi-Photos)
# ==============================================================================
Write-Host "3. Collecting Encar Personal Direct Deal vehicles..." -ForegroundColor Yellow
$encarLiveTotal = 0
$encarItems = New-Object System.Collections.Generic.List[object]
$uaEncar = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

try {
    $uDom = "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.CarType.Y._.Separation.A.)&sr=%7CModifiedDate%7C0%7C200"
    $bDomRaw = & $CurlBin -s -L --max-time 25 -A $uaEncar -H "Accept-Language: ko-KR,ko;q=0.9" -H "Referer: http://www.encar.com/" $uDom
    $bDom = if ($bDomRaw) { $bDomRaw | ConvertFrom-Json } else { $null }

    $uImp = "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.CarType.N._.Separation.A.)&sr=%7CModifiedDate%7C0%7C150"
    $bImpRaw = & $CurlBin -s -L --max-time 25 -A $uaEncar -H "Accept-Language: ko-KR,ko;q=0.9" -H "Referer: http://www.encar.com/" $uImp
    $bImp = if ($bImpRaw) { $bImpRaw | ConvertFrom-Json } else { $null }

    if ($bDom -and $bDom.Count) { $encarLiveTotal += [int]$bDom.Count }
    if ($bImp -and $bImp.Count) { $encarLiveTotal += [int]$bImp.Count }

    foreach ($grp in @(
        @{ origin = "국산"; items = $(if ($bDom) { $bDom.SearchResults } else { @() }) },
        @{ origin = "수입"; items = $(if ($bImp) { $bImp.SearchResults } else { @() }) }
    )) {
        foreach ($it in $grp.items) {
            if (-not $it.Id) { continue }
            if ($it.SellType -and $it.SellType -ne "일반") { continue }
            $prc = [int]$it.Price
            if ($prc -le 50 -or $prc -gt 50000) { continue }
            $id = "encar_" + $it.Id
            if ($seenIds.ContainsKey($id)) { continue }

            $imgs = @()
            if ($it.Photos -and $it.Photos.Count -gt 0) {
                foreach ($ph in ($it.Photos | Sort-Object ordering | Select-Object -First 5)) {
                    if ($ph.location) {
                        $imgs += ("https://ci.encar.com" + $ph.location)
                    }
                }
            } elseif ($it.Photo) {
                $imgs += ("https://ci.encar.com" + $it.Photo + "001.jpg")
            }
            if ($imgs.Count -eq 0) { continue }
            $seenIds[$id] = $true

            $yrRaw = [string]([int]$it.Year)
            $yrLabel = if ($yrRaw.Length -ge 6) { "$($yrRaw.Substring(2,2))년 $([int]$yrRaw.Substring(4,2))월" } else { "$($it.FormYear)년형" }
            $yrNum = if ($it.FormYear) { [int]$it.FormYear } elseif ($yrRaw.Length -ge 4) { [int]$yrRaw.Substring(0,4) } else { 2022 }
            $fullTitle = "$($it.Manufacturer) $($it.Model) $($it.Badge)".Trim()
            $sido = Normalize-Sido ([string]$it.OfficeCityState)

            $encarItems.Add([ordered]@{
                id = $id
                carId = [string]$it.Id
                platform = "encar"
                platformLabel = "엔카 개인직거래"
                isExternal = $true
                origin = $grp.origin
                brand = [string]$it.Manufacturer
                model = [string]$it.Model
                title = $fullTitle
                year = $yrNum
                yearLabel = $yrLabel
                mileageKm = [int]$it.Mileage
                fuel = Infer-Fuel $fullTitle ([string]$it.FuelType)
                bodyType = Infer-BodyType $fullTitle
                priceManwon = $prc
                priceBand = Get-PriceBand $prc
                sido = $sido
                region = [string]$it.OfficeCityState
                plateNo = "외부직거래"
                avatarUrl = ""
                thumbnail = $imgs[0]
                images = $imgs
                diagYn = $false
                negoYn = $false
                ownerComment = "엔카닷컴 셀프등록(개인 판매자)으로 접수된 직거래 차량입니다. 성능기록부 및 차주 직통 연락처는 엔카 상세페이지에서 확인 가능합니다."
                options = @("엔카 셀프등록", "개인 판매자", "직거래 매물")
                tags = @("엔카닷컴 수집", "개인 직거래", "원본 아웃랜딩")
                extrColor = "원본 페이지 확인"
                intrColor = "원본 페이지 확인"
                transmission = "오토"
                wishCount = 0
                chatCount = 0
                status = "판매중"
                collectedAt = $CollectedAtStr
                outUrl = "http://www.encar.com/dc/dc_cardetailview.do?carid=$($it.Id)"
            })
        }
    }
} catch { Write-Warning "Encar API warning: $_" }

if ($encarItems.Count -gt 0) {
    $livePlatforms.Add("encar")
    Write-Host "   Encar live count: $($encarItems.Count) (Market Total: $encarLiveTotal)" -ForegroundColor Green
} else {
    $prevEncar = @($prevVehicles | Where-Object { $_.platform -eq "encar" })
    foreach ($pv in $prevEncar) { $encarItems.Add($pv) }
    Write-Warning "   Encar live returned 0; preserved $($encarItems.Count) previous Encar items."
}

# ==============================================================================
# D. KB차차차 개인직거래 (directYn=Y — Pages 1..3 + Thumbnails)
# ==============================================================================
Write-Host "4. Collecting KB ChaChaCha Personal Direct Deal vehicles..." -ForegroundColor Yellow
$kbItems = New-Object System.Collections.Generic.List[object]
try {
    for ($kbPage = 1; $kbPage -le 3; $kbPage++) {
        $tempKb = Join-Path $TempDir "kb_proto_$($PID)_$($kbPage).html"
        & $CurlBin -s -L --compressed --max-time 25 -A $uaEncar -H "Accept-Language: ko-KR,ko;q=0.9" -H "Referer: https://www.kbchachacha.com/" "https://www.kbchachacha.com/public/search/list.empty?page=$kbPage&sort=-orderDate&directYn=Y" -o $tempKb
        if (-not (Test-Path $tempKb)) { break }
        $kbHtml = [System.IO.File]::ReadAllText($tempKb, [System.Text.Encoding]::UTF8)
        Remove-Item $tempKb -Force -ErrorAction SilentlyContinue

        $cardBlocks = $kbHtml -split '<div class="area\s*"'
        if ($cardBlocks.Count -le 1) { break }

        $addedOnPage = 0
        foreach ($blk in ($cardBlocks | Select-Object -Skip 1)) {
            $seqM = [regex]::Match($blk, 'data-car-seq="(\d+)"')
            if (-not $seqM.Success) { continue }
            $seq = $seqM.Groups[1].Value
            $id = "kb_" + $seq
            if ($seenIds.ContainsKey($id)) { continue }

            $imgM = [regex]::Match($blk, '<img[^>]+src="(https://img\.kbchachacha\.com/[^"]+)"')
            if (-not $imgM.Success) { continue }
            $imgUrl = ($imgM.Groups[1].Value -replace 'width=\d+','width=720')

            $titM = [regex]::Match($blk, '<strong class="tit">\s*([\s\S]*?)\s*</strong>')
            $title = if ($titM.Success) { ($titM.Groups[1].Value -replace '<[^>]+>', '' -replace '실차주|직거래', '' -replace '\s+', ' ').Trim() } else { "" }
            if (-not $title) { continue }

            $gaM = [regex]::Match($blk, 'vehicle_price":"([^"]+)"')
            $prcNum = 0
            if ($gaM.Success -and $gaM.Groups[1].Value -match '(\d+)') { $prcNum = [int]$Matches[1] }
            if ($prcNum -le 0) { continue }

            $spans = [regex]::Match($blk, '<div class="data-line">([\s\S]*?)</div>')
            $yr = 2020; $yrLabel = "20년형"; $km = 0; $loc = "경기"
            if ($spans.Success) {
                $spList = [regex]::Matches($spans.Groups[1].Value, '<span>([\s\S]*?)</span>')
                if ($spList.Count -ge 1) {
                    $yRaw = ($spList[0].Groups[1].Value -replace '<[^>]+>','').Trim()
                    $yrLabel = $yRaw
                    if ($yRaw -match '(\d{2})/\d{2}') {
                        $yy = [int]$Matches[1]
                        $yr = if ($yy -gt 50) { 1900 + $yy } else { 2000 + $yy }
                        $yrLabel = $yRaw -replace '/','년 '
                        $yrLabel = "$($yrLabel)월"
                    }
                }
                if ($spList.Count -ge 2) {
                    $kRaw = ($spList[1].Groups[1].Value -replace '[^\d]', '')
                    if ($kRaw) { $km = [int]$kRaw }
                }
                if ($spList.Count -ge 3) {
                    $loc = ($spList[2].Groups[1].Value -replace '<[^>]+>','').Trim()
                }
            }

            $seenIds[$id] = $true
            $origin = if ($title -match "현대|기아|제네시스|쉐보레|르노|쌍용|KG") { "국산" } else { "수입" }
            $words = $title -split '\s+'
            $brand = $words[0]
            $model = if ($words.Count -ge 2) { $words[1] } else { $title }
            $sido = Normalize-Sido $loc

            $kbItems.Add([ordered]@{
                id = $id
                carId = $seq
                platform = "kb"
                platformLabel = "KB차차차 직거래"
                isExternal = $true
                origin = $origin
                brand = $brand
                model = $model
                title = $title
                year = $yr
                yearLabel = $yrLabel
                mileageKm = $km
                fuel = Infer-Fuel $title ""
                bodyType = Infer-BodyType $title
                priceManwon = $prcNum
                priceBand = Get-PriceBand $prcNum
                sido = $sido
                region = $loc
                plateNo = "외부직거래"
                avatarUrl = ""
                thumbnail = $imgUrl
                images = @($imgUrl)
                diagYn = $false
                negoYn = $false
                ownerComment = "KB차차차 개인 직거래(directYn=Y)로 등록된 차주 직접 판매 매물입니다. KB차차차 원본 페이지에서 상세 시세 및 판매자 정보를 확인하세요."
                options = @("KB차차차 직거래", "개인 차주 등록", "KB시세 제공")
                tags = @("KB차차차 수집", "개인 직거래", "원본 아웃랜딩")
                extrColor = "원본 페이지 확인"
                intrColor = "원본 페이지 확인"
                transmission = "오토"
                wishCount = 0
                chatCount = 0
                status = "판매중"
                collectedAt = $CollectedAtStr
                outUrl = "https://www.kbchachacha.com/public/car/detail.kbc?carSeq=$seq"
            })
            $addedOnPage++
        }
        if ($addedOnPage -eq 0) { break }
    }
} catch { Write-Warning "KB warning: $_" }

$kbLiveTotal = $kbItems.Count
if ($kbItems.Count -gt 0) {
    $livePlatforms.Add("kb")
    Write-Host "   KB live count: $($kbItems.Count)" -ForegroundColor Green
} else {
    $prevKb = @($prevVehicles | Where-Object { $_.platform -eq "kb" })
    foreach ($pv in $prevKb) { $kbItems.Add($pv) }
    Write-Warning "   KB live returned 0; preserved $($kbItems.Count) previous KB items."
}

if ($RequireAllLive -and $livePlatforms.Count -lt 4) {
    throw "Only $($livePlatforms.Count)/4 platforms succeeded live ($($livePlatforms -join ', '))."
}

# ==============================================================================
# E. Combine Vehicles & Compute Authoritative Market KPIs
# ==============================================================================
$vehicles = New-Object System.Collections.Generic.List[object]
foreach ($v in $kcarItems)   { $vehicles.Add($v) }
foreach ($v in $daangnItems) { $vehicles.Add($v) }
foreach ($v in $encarItems)  { $vehicles.Add($v) }
foreach ($v in $kbItems)     { $vehicles.Add($v) }

if ($vehicles.Count -lt 50) {
    throw "Insufficient total vehicles ($($vehicles.Count)); aborting write to protect existing bundle."
}

$finalKcarTotal = if ($kcarLiveTotal -gt 0) { $kcarLiveTotal }
                  elseif ($latestTrend -and [int]$latestTrend.kcarDirectCount -gt 0) { [int]$latestTrend.kcarDirectCount }
                  elseif ($prevMeta -and $prevMeta.platforms.kcar.totalCount) { [int]$prevMeta.platforms.kcar.totalCount }
                  else { $kcarItems.Count }

$finalDaangnTotal = if ($daangnLiveTotal -gt 0) { $daangnLiveTotal }
                    elseif ($latestTrend -and [int]$latestTrend.daangnCarsCount -gt 0) { [int]$latestTrend.daangnCarsCount }
                    elseif ($prevMeta -and $prevMeta.platforms.daangn.totalCount) { [int]$prevMeta.platforms.daangn.totalCount }
                    else { $daangnItems.Count }

$finalEncarTotal = if ($encarLiveTotal -gt 0) { $encarLiveTotal }
                   elseif ($latestTrend -and [int]$latestTrend.encarPersonalCount -gt 0) { [int]$latestTrend.encarPersonalCount }
                   elseif ($prevMeta -and $prevMeta.platforms.encar.totalCount) { [int]$prevMeta.platforms.encar.totalCount }
                   else { $encarItems.Count }

$finalKbTotal = if ($kbLiveTotal -gt 0) { $kbLiveTotal }
                elseif ($latestTrend -and [int]$latestTrend.kbDirectCount -gt 0) { [int]$latestTrend.kbDirectCount }
                elseif ($prevMeta -and $prevMeta.platforms.kb.totalCount) { [int]$prevMeta.platforms.kb.totalCount }
                else { $kbItems.Count }

$marketTotal = $finalKcarTotal + $finalDaangnTotal + $finalEncarTotal + $finalKbTotal
$rawDbTotal = if ($latestTrend -and [int]$latestTrend.rawVehicleCount -gt 0) { [int]$latestTrend.rawVehicleCount } else { $vehicles.Count }

$meta = [ordered]@{
    crawledDate = $TodayDate
    updatedAt = $UpdatedAtStr
    livePlatformsCount = $livePlatforms.Count
    livePlatforms = $livePlatforms.ToArray()
    rawDbTotal = $rawDbTotal
    marketTotal = $marketTotal
    platforms = [ordered]@{
        kcar = [ordered]@{
            name = "K Car 안심직거래"
            totalCount = $finalKcarTotal
            onSaleCount = if ($latestTrend -and $latestTrend.kcarOnSaleCount) { [int]$latestTrend.kcarOnSaleCount } else { $finalKcarTotal }
            avgPrice = Calc-AvgPrice $kcarItems.ToArray() $(if ($latestTrend) { [int]$latestTrend.kcarAvgPrice } else { 2200 })
            loadedWithPhotoCount = $kcarItems.Count
        }
        daangn = [ordered]@{
            name = "당근마켓"
            totalCount = $finalDaangnTotal
            onSaleCount = if ($latestTrend -and $latestTrend.daangnOnSaleCount) { [int]$latestTrend.daangnOnSaleCount } else { $finalDaangnTotal }
            avgPrice = Calc-AvgPrice $daangnItems.ToArray() $(if ($latestTrend) { [int]$latestTrend.daangnAvgPrice } else { 1500 })
            loadedWithPhotoCount = $daangnItems.Count
        }
        encar = [ordered]@{
            name = "엔카닷컴"
            totalCount = $finalEncarTotal
            onSaleCount = if ($latestTrend -and $latestTrend.encarOnSaleCount) { [int]$latestTrend.encarOnSaleCount } else { $finalEncarTotal }
            avgPrice = Calc-AvgPrice $encarItems.ToArray() $(if ($latestTrend) { [int]$latestTrend.encarAvgPrice } else { 2400 })
            loadedWithPhotoCount = $encarItems.Count
        }
        kb = [ordered]@{
            name = "KB차차차"
            totalCount = $finalKbTotal
            onSaleCount = $finalKbTotal
            avgPrice = Calc-AvgPrice $kbItems.ToArray() $(if ($latestTrend) { [int]$latestTrend.kbAvgPrice } else { 1800 })
            loadedWithPhotoCount = $kbItems.Count
        }
    }
}

$metaJson = $meta | ConvertTo-Json -Depth 6
$vehiclesJson = $vehicles | ConvertTo-Json -Depth 5 -Compress

$jsContent = @"
// K Car 안심직거래 x 세상의 모든 직거래 통합 크롤링 데이터셋
// Auto-Updated: $UpdatedAtStr KST (Live Platforms: $($livePlatforms -join ', '))
window.KCAR_ALL_C2C_META = $metaJson;
window.KCAR_ALL_C2C_VEHICLES = $vehiclesJson;
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($OutJsPath, $jsContent, $utf8NoBom)
Write-Host "=== DONE! Total vehicles: $($vehicles.Count) | Live Platforms: $($livePlatforms.Count)/4 ($($livePlatforms -join ', ')) ===" -ForegroundColor Cyan
Write-Host ($meta | ConvertTo-Json -Depth 4)
