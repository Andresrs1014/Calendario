import json
import re
import sys
import requests
from pathlib import Path
from typing import Optional

try:
    import bs4
except ImportError:
    print("BeautifulSoup4 no instalado. Ejecuta: pip install beautifulsoup4")
    sys.exit(1)


MOODLE_URL = "https://campusvirtual.ibero.edu.co"
LOGIN_URL = f"{MOODLE_URL}/login/index.php"


class MoodleLogin:
    """Login to Moodle and extract session cookies programmatically."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })

    def get_login_token(self) -> tuple[str, str]:
        """Get logintoken from login page."""
        print(f"Obteniendo página de login...")
        resp = self.session.get(LOGIN_URL, timeout=30)
        resp.raise_for_status()

        soup = bs4.BeautifulSoup(resp.text, "html.parser")
        token_input = soup.find("input", {"name": "logintoken"})
        token = token_input["value"] if token_input else ""

        return resp.cookies.get_dict(), token

    def login(self, username: str, password: str) -> dict:
        """
        Perform login to Moodle.

        Args:
            username: Your Moodle username/email
            password: Your Moodle password

        Returns:
            Dict with session_cookie and sesskey
        """
        cookies, logintoken = self.get_login_token()

        print(f"Realizando login como: {username}")

        login_data = {
            "username": username,
            "password": password,
            "logintoken": logintoken,
        }

        resp = self.session.post(LOGIN_URL, data=login_data, cookies=cookies, allow_redirects=True, timeout=30)

        login_cookies = self.session.cookies.get_dict()

        if "MoodleSession" not in login_cookies:
            raise Exception("Login fallido: No se encontró cookie de sesión")

        print(f"✓ Login exitoso!")
        print(f"  MoodleSession: {login_cookies['MoodleSession'][:20]}...")

        sesskey = self._get_sesskey()

        return {
            "session_cookie": login_cookies["MoodleSession"],
            "sesskey": sesskey,
        }

    def _get_sesskey(self) -> Optional[str]:
        """Extract sesskey from any page after login."""
        try:
            resp = self.session.get(f"{MOODLE_URL}/my", timeout=30)
            soup = bs4.BeautifulSoup(resp.text, "html.parser")

            scripts = soup.find_all("script")
            for script in scripts:
                if script.string and "sesskey" in script.string:
                    match = re.search(r'sesskey["\']?\s*[:=]\s*["\']([^"\']+)["\']', script.string)
                    if match:
                        key = match.group(1)
                        print(f"✓ Sesskey encontrado: {key}")
                        return key

            scripts_js = soup.find_all("script", {"src": True})
            for script_tag in scripts_js:
                try:
                    src = script_tag["src"]
                    if "module" in src or "init" in src:
                        js_resp = self.session.get(src, timeout=10)
                        match = re.search(r'sesskey["\']?\s*[:=]\s*["\']([^"\']+)["\']', js_resp.text)
                        if match:
                            key = match.group(1)
                            print(f"✓ Sesskey encontrado en {src[:50]}: {key}")
                            return key
                except:
                    continue

            resp_json = self.session.get(
                f"{MOODLE_URL}/lib/ajax/service.php?sesskey=",
                timeout=10
            )
            match = re.search(r'"sesskey"\s*:\s*"([^"]+)"', resp_json.text or "")
            if match:
                print(f"✓ Sesskey encontrado en API: {match.group(1)}")
                return match.group(1)

            print("⚠ Sesskey no encontrado automáticamente")
            print("  Puede que aún funcione, pero asegúrate de extraerlo manualmente si falla")
            return None

        except Exception as e:
            print(f"⚠ Error extrayendo sesskey: {e}")
            return None

    def verify_session(self) -> bool:
        """Verify if current session is valid."""
        try:
            resp = self.session.get(f"{MOODLE_URL}/my", timeout=30)
            return "loggedin" in resp.text or resp.status_code == 200
        except:
            return False


def save_config(data: dict, filepath: str = "moodle_config.json"):
    """Save config to file."""
    config_path = Path(__file__).parent.parent / filepath
    with open(config_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"✓ Configuración guardada en {config_path}")
    return config_path


def load_config(filepath: str = "moodle_config.json") -> dict:
    """Load saved config."""
    config_path = Path(__file__).parent.parent / filepath
    if config_path.exists():
        with open(config_path) as f:
            return json.load(f)
    return {}


def interactive_login():
    """Interactive login with username/password prompt."""
    print("="*60)
    print("MOODLE LOGIN SCRIPT")
    print("="*60)

    username = input("Usuario (correo o usuario): ").strip()
    password = input("Contraseña: ").strip()

    if not username or not password:
        print("❌ Usuario y contraseña son requeridos")
        return None

    try:
        client = MoodleLogin()
        result = client.login(username, password)
        save_config(result)
        return result
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return None


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Login a Moodle y extraer cookies")
    parser.add_argument("-u", "--username", help="Usuario de Moodle")
    parser.add_argument("-p", "--password", help="Contraseña de Moodle")
    parser.add_argument("--check", action="store_true", help="Verificar sesión guardada")

    args = parser.parse_args()

    if args.check:
        config = load_config()
        if config:
            print("Configuración guardada encontrada:")
            print(f"  Session: {config.get('session_cookie', 'N/A')[:30]}...")
            print(f"  Sesskey: {config.get('sesskey', 'N/A')}")

            client = MoodleLogin()
            client.session.cookies.set("MoodleSession", config["session_cookie"])
            if client.verify_session():
                print("✓ Sesión válida")
            else:
                print("✗ Sesión inválida o expirada")
        else:
            print("No hay configuración guardada")
        return

    if args.username and args.password:
        try:
            client = MoodleLogin()
            result = client.login(args.username, args.password)
            save_config(result)
            print("\n✓ Listo! Usa estos datos para sincronizar:")
            print(f"  session_cookie: {result['session_cookie']}")
            print(f"  sesskey: {result.get('sesskey', '')}")
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        interactive_login()


if __name__ == "__main__":
    main()
