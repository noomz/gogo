# Example curl

## Create short Url (POST)
```bash
curl -X POST -d '{"to":"http://opendream.co.th","alias":"opendream"}' http://localhost:8080/api/url --header "Content-Type: application/json"
```

### Sample return JSON
```json
{
  "id": "563f52892ea9df1b6b6bb7a9",
  "to": "http://opendream.co.th",
  "short": "NJpVgrOze",
  "alias": "opendream",
  "passcode": "Y_5cce9M",
  "conditions": []
}
```
You need to keep returned `id` and `passcode` to update short URL later.

## Update short URL (PUT)
```bash
curl -X PUT -d '{"to":"http://opendream.co.th","alias":"new-opendream","passcode":"Y_5cce9M"}' http://localhost:8080/api/url/563f52892ea9df1b6b6bb7a9 --header "Content-Type: application/json"
```
You can only update `to`, `alias` and `conditions`.

## Use condition for dynamic destination (PUT)
```bash
curl -X PUT -d '{"conditions":[{"expression":"useragent.isMobile","to":"http://m.opendream.co.th"}]}' http://localhost:8080/api/url --header "Content-Type: application/json"
```
You can use only one provided variable named `useragent` for now. And for the sake of readability, here is the above JSON.
```json
{
  "conditions": [
    {
      "expression": "useragent.isMobile",
      "to": "http://m.opendream.co.th"
    }
  ]
}
```

### Example condition.expression.useragent
```json
{
  "isMobile": false,
  "isTablet": false,
  "isiPad": false,
  "isiPod": false,
  "isiPhone": false,
  "isAndroid": false,
  "isBlackberry": false,
  "isOpera": false,
  "isIE": false,
  "isEdge": false,
  "isIECompatibilityMode": false,
  "isSafari": false,
  "isFirefox": false,
  "isWebkit": false,
  "isChrome": false,
  "isKonqueror": false,
  "isOmniWeb": false,
  "isSeaMonkey": false,
  "isFlock": false,
  "isAmaya": false,
  "isEpiphany": false,
  "isDesktop": false,
  "isWindows": false,
  "isLinux": false,
  "isLinux64": false,
  "isMac": false,
  "isChromeOS": false,
  "isBada": false,
  "isSamsung": false,
  "isRaspberry": false,
  "isBot": false,
  "isCurl": true,
  "isAndroidTablet": false,
  "isWinJs": false,
  "isKindleFire": false,
  "isSilk": false,
  "silkAccelerated": false,
  "browser": "unknown",
  "os": "Curl",
  "platform": "Curl",
  "geoIp": {},
  "source": "curl/7.43.0"
}
```
