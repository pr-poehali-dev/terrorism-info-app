"""
Бэкенд для получения новостей о терроризме и безопасности.
Использует World News API с кешированием на 4 часа.
Если API-ключ не задан — возвращает демо-данные.
"""

import json
import os
import time
import urllib.request
import urllib.parse


CACHE: dict = {"data": None, "ts": 0}
CACHE_TTL = 4 * 3600  # 4 часа

DEMO_NEWS = [
    {
        "id": 1,
        "title": "МЧС провело антитеррористические учения в 15 регионах России",
        "summary": "Масштабные учения по отработке действий при угрозе теракта прошли одновременно в 15 субъектах Российской Федерации.",
        "url": "https://mchs.gov.ru",
        "source": "МЧС России",
        "publishedAt": "2026-04-25T08:00:00Z",
        "critical": False,
    },
    {
        "id": 2,
        "title": "НАК: усилен контроль на объектах транспортной инфраструктуры",
        "summary": "Национальный антитеррористический комитет сообщил об усилении мер безопасности на железнодорожных вокзалах и аэропортах.",
        "url": "https://нак.рф",
        "source": "НАК",
        "publishedAt": "2026-04-25T07:30:00Z",
        "critical": False,
    },
    {
        "id": 3,
        "title": "Европол раскрыл сеть по финансированию террористических группировок",
        "summary": "В ходе международной операции задержаны 12 человек, подозреваемых в переводе средств террористам.",
        "url": "https://europol.europa.eu",
        "source": "Europol",
        "publishedAt": "2026-04-24T18:20:00Z",
        "critical": True,
    },
    {
        "id": 4,
        "title": "В Москве прошли учения по эвакуации при угрозе взрыва",
        "summary": "Сотрудники ФСБ и МЧС совместно отработали сценарий обнаружения и нейтрализации взрывного устройства в торговом центре.",
        "url": "https://fsb.ru",
        "source": "ФСБ России",
        "publishedAt": "2026-04-24T14:00:00Z",
        "critical": False,
    },
    {
        "id": 5,
        "title": "ООН призвала к усилению международного сотрудничества в борьбе с терроризмом",
        "summary": "На заседании Совета Безопасности ООН рассмотрены новые механизмы обмена разведывательными данными между государствами-членами.",
        "url": "https://un.org",
        "source": "ООН",
        "publishedAt": "2026-04-24T12:00:00Z",
        "critical": False,
    },
    {
        "id": 6,
        "title": "Россия передала Интерполу данные о 200 иностранных террористах",
        "summary": "В рамках борьбы с международным терроризмом российские спецслужбы передали партнёрам информацию о лицах, разыскиваемых по статьям о терроризме.",
        "url": "https://interpol.int",
        "source": "Интерпол",
        "publishedAt": "2026-04-23T16:45:00Z",
        "critical": False,
    },
]

STOP_WORDS = [
    "ddos", "хакер", "несчастный случай", "бытовой", "ограбление магазина",
    "угон автомобиля", "скандал", "арест блогера",
]


def is_relevant(title: str, summary: str) -> bool:
    text = (title + " " + summary).lower()
    for sw in STOP_WORDS:
        if sw in text:
            return False
    return True


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    now = time.time()
    if CACHE["data"] and (now - CACHE["ts"]) < CACHE_TTL:
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({"news": CACHE["data"], "cached": True, "ts": CACHE["ts"]}),
        }

    api_key = os.environ.get("WORLD_NEWS_API_KEY", "")

    if not api_key:
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({"news": DEMO_NEWS, "cached": False, "ts": now, "demo": True}),
        }

    query = urllib.parse.quote("терроризм OR теракт OR антитеррор OR взрыв OR контртеррор")
    url = (
        f"https://api.worldnewsapi.com/search-news"
        f"?language=ru"
        f"&text={query}"
        f"&number=20"
        f"&sort=publish-time"
        f"&sort-direction=DESC"
        f"&api-key={api_key}"
    )

    req = urllib.request.Request(url, headers={"User-Agent": "AntiterrorApp/1.0"})
    with urllib.request.urlopen(req, timeout=8) as resp:
        raw = json.loads(resp.read().decode())

    articles = raw.get("news", [])
    news = []
    for a in articles:
        title = a.get("title", "")
        summary = a.get("summary", a.get("text", ""))[:280]
        if not is_relevant(title, summary):
            continue
        critical = any(w in (title + summary).lower() for w in ["теракт", "взрыв", "жертв", "погибш", "атак"])
        news.append({
            "id": a.get("id", 0),
            "title": title,
            "summary": summary,
            "url": a.get("url", ""),
            "source": a.get("source", {}).get("name", "Новости") if isinstance(a.get("source"), dict) else str(a.get("source", "Новости")),
            "publishedAt": a.get("publish_date", ""),
            "critical": critical,
            "image": a.get("image", ""),
        })

    if not news:
        news = DEMO_NEWS

    CACHE["data"] = news
    CACHE["ts"] = now

    return {
        "statusCode": 200,
        "headers": {**cors, "Content-Type": "application/json"},
        "body": json.dumps({"news": news, "cached": False, "ts": now}),
    }
