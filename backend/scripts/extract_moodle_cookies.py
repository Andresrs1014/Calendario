import asyncio
import json
import sys
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Playwright no instalado. Ejecuta:")
    print("  pip install playwright")
    print("  playwright install chromium")
    sys.exit(1)


async def extract_moodle_cookies():
    """Opens browser, lets user login to Moodle, and extracts session cookies."""

    MOODLE_URL = "https://campusvirtual.ibero.edu.co"
    LOGIN_URL = f"{MOODLE_URL}/login/index.php"

    cookies_data = {}
    sesskey_data = {"sesskey": None}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, args=["--disable-blink-images"])
        context = await browser.new_context()
        page = await context.new_page()

        print(f"Abriendo {LOGIN_URL}...")
        await page.goto(LOGIN_URL)

        print("\n" + "="*60)
        print("INSTRUCCIONES:")
        print("1. Inicia sesión en Moodle con tus credenciales")
        print("2. Una vez logueado, espera a que se complete la carga")
        print("3. Presiona ENTER aquí cuando esté listo")
        print("="*60 + "\n")

        input("Presiona ENTER después de iniciar sesión...")

        print("Extrayendo cookies...")

        all_cookies = await context.cookies()

        for cookie in all_cookies:
            if cookie["name"] == "MoodleSession":
                cookies_data["MoodleSession"] = cookie["value"]
                print(f"✓ MoodleSession encontrado: {cookie['value'][:20]}...")
            elif cookie["name"] == "MoodleSessionTest":
                cookies_data["MoodleSessionTest"] = cookie["value"]

        try:
            page_content = await page.content()
            import re
            sesskey_match = re.search(r'"sesskey"\s*:\s*"([^"]+)"', page_content)
            if sesskey_match:
                sesskey_data["sesskey"] = sesskey_match.group(1)
                print(f"✓ sesskey encontrado: {sesskey_data['sesskey']}")
            else:
                script = """
                () => {
                    let scripts = document.querySelectorAll('script');
                    for (let s of scripts) {
                        if (s.textContent.includes('sesskey')) {
                            let m = s.textContent.match(/sesskey["']?\s*:\s*["']([^"']+)["']/);
                            if (m) return m[1];
                        }
                    }
                    return null;
                }
                """
                sesskey = await page.evaluate(script)
                if sesskey:
                    sesskey_data["sesskey"] = sesskey
                    print(f"✓ sesskey encontrado (script): {sesskey}")
        except Exception as e:
            print(f"⚠ No pude extraer sesskey automáticamente: {e}")

        await browser.close()

    if not cookies_data.get("MoodleSession"):
        print("\n❌ Error: No se encontró cookie MoodleSession")
        print("   Asegúrate de estar logueado en Moodle")
        return None

    return {
        "session_cookie": cookies_data.get("MoodleSession", ""),
        "sesskey": sesskey_data["sesskey"],
        "cookies": cookies_data
    }


def save_config(data: dict, filepath: str = "moodle_config.json"):
    """Save extracted data to config file."""
    config_path = Path(__file__).parent / filepath
    with open(config_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\n✓ Configuración guardada en {config_path}")
    return config_path


def load_config(filepath: str = "moodle_config.json") -> dict:
    """Load saved config."""
    config_path = Path(__file__).parent / filepath
    if config_path.exists():
        with open(config_path) as f:
            return json.load(f)
    return {}


async def main():
    print("="*60)
    print("MOODLE COOKIE EXTRACTOR")
    print("="*60)

    existing = load_config()
    if existing:
        print(f"\n⚠ Ya existe configuración guardada en moodle_config.json")
        print(f"   Session: {existing.get('session_cookie', 'N/A')[:20]}...")
        resp = input("¿Deseas sobrescribirla? (s/n): ").strip().lower()
        if resp != 's':
            print("Usando configuración existente.")
            return existing

    result = await extract_moodle_cookies()

    if result:
        save_config(result)
        print("\n" + "="*60)
        print("RESUMEN:")
        print(f"  Session Cookie: {result['session_cookie'][:30]}...")
        print(f"  Sesskey: {result.get('sesskey', 'No encontrado')}")
        print("="*60)
        print("\nYa puedes usar estos datos en la sincronización de tu calendario.")
    else:
        print("\n❌ No se pudo extraer la información necesaria.")


if __name__ == "__main__":
    asyncio.run(main())
