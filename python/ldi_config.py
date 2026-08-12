"""
LDI Configuration Management
Replaces hardcoded job revisions, email lists, and hold lists from the original scripts.
Config is stored in a JSON file and can be updated via the web UI.
"""

import json
import os
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path

logger = logging.getLogger(__name__)

DEFAULT_CONFIG_PATH = os.environ.get(
    "LDI_CONFIG_PATH",
    os.path.join(os.path.dirname(__file__), "ldi_config.json")
)


def _default_config() -> Dict[str, Any]:
    """Return the default configuration, extracted from the original scripts."""
    return {
        "remote_system": "apclnx01",
        "archive_base_path": "/archive",
        "opfx_output_path": "/gen_dbs/mounts/apclnx01/opfx",
        "genesis_version": 110,

        # Special job revision overrides
        # Each entry: job_number -> { label choices -> revision path }
        "special_job_revisions": {
            "72687": {
                "prompt": "Choose revision for 72687",
                "options": [
                    {"label": "Inner Layers", "revision": None},
                    {"label": "Outer or Soldermask Layers", "revision": "02Jun2021.1005"}
                ]
            },
            "72686": {
                "prompt": "Choose revision for 72686",
                "options": [
                    {"label": "Inner Layers", "revision": None},
                    {"label": "Outer or Soldermask Layers", "revision": "12Feb2024.1654"}
                ]
            },
            "74937": {
                "prompt": "Choose revision for 74937",
                "options": [
                    {"label": "Inner Layers", "revision": None},
                    {"label": "Outer or Soldermask Layers", "revision": "22Aug2024.1323"}
                ]
            },
            "74699": {
                "prompt": "Choose revision for 74699",
                "options": [
                    {"label": "New LDI location for via_plt1_24 and via_plt24_1", "revision": None},
                    {"label": "Old LDI location for via_plt1_24 and via_plt24_1", "revision": "31Aug2021.1157"}
                ]
            },
            "75478": {
                "prompt": "Choose revision for 75478",
                "options": [
                    {"label": "All other layers", "revision": None},
                    {"label": "Layers 2 via_plt2_10 10 via_plt10_2", "revision": "03Apr2023.1819"}
                ]
            },
            "73567": {
                "prompt": "Choose revision for 73567",
                "options": [
                    {"label": "Inner Layers", "revision": None},
                    {"label": "Outer or via_plt Layers", "revision": "07May2024.1352"}
                ]
            }
        },

        # Jobs that should skip text updates
        "skip_text_update_jobs": [
            "73590", "74338", "75379", "75380", "01561",
            "75336", "74963", "75884"
        ],

        # Hold list path (read from file on the Genesis server)
        "hold_list_path": "/genesis/sys/scripts/utils/on_hold_list",

        # Email notification lists
        "cam_list": [
            "rsaporito@amphenol-apc.com",
            "chall@amphenol-apc.com",
            "braymond@amphenol-apc.com",
            "crolfe@amphenol-apc.com",
            "rpatel@amphenol-apc.com",
            "jlacen@amphenol-apc.com",
            "jcintron@amphenol-apc.com",
            "jamidio@amphenol-apc.com"
        ],

        # Date code formats supported
        "date_code_formats": [
            "WWYY", "WW-YY", "WW/YY", "YYWW", "YY-WW", "YY/WW",
            "MMYY", "YYMM", "YYYYMM", "YYYY-MM-DD", "YYYYMMDD",
            "YYYYWW", "YYYY-WW", "YYMMDD", "YYYY-DD-MM", "WWY",
            "YWW", "MMY", "MM-Y", "YMM", "YMD", "MM/DD/YYYY",
            "WW/YYYY", "YYDDD", "DDDYY"
        ],

        # Released-revision lookup is now done natively in Python
        # (job_validator._find_released_revision reads
        # {archive_base_path}/{job}/CAM/released directly over SSH — ported
        # from the legacy find_released_rev.pl). This path is retained only
        # for reference/back-compat and is no longer invoked.
        "find_rev_script": "/export/home3/archive_scripts/find_released_rev.pl",

        # Jobs where PE target should not be reversed
        "pe_target_bot_file": "/genesis/sys/scripts/output/jobs_pe_target_bot",
    }


class LDIConfig:
    """Manages LDI configuration with file-based persistence."""

    def __init__(self, config_path: str = DEFAULT_CONFIG_PATH):
        self.config_path = config_path
        self._config: Dict[str, Any] = {}
        self.load()

    def load(self) -> None:
        """Load config from file, falling back to defaults."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r") as f:
                    self._config = json.load(f)
                logger.info(f"Loaded config from {self.config_path}")
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Failed to load config: {e}, using defaults")
                self._config = _default_config()
        else:
            logger.info("No config file found, using defaults")
            self._config = _default_config()
            self.save()

    def save(self) -> None:
        """Persist config to file."""
        try:
            os.makedirs(os.path.dirname(self.config_path) or ".", exist_ok=True)
            with open(self.config_path, "w") as f:
                json.dump(self._config, f, indent=2)
            logger.info(f"Saved config to {self.config_path}")
        except IOError as e:
            logger.error(f"Failed to save config: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        return self._config.get(key, default)

    def set(self, key: str, value: Any) -> None:
        self._config[key] = value
        self.save()

    def get_all(self) -> Dict[str, Any]:
        return dict(self._config)

    # ---- Convenience methods ----

    def get_special_job_revisions(self) -> Dict[str, Any]:
        return self.get("special_job_revisions", {})

    def is_special_job(self, job: str) -> bool:
        return job in self.get_special_job_revisions()

    def get_revision_options(self, job: str) -> Optional[Dict[str, Any]]:
        revisions = self.get_special_job_revisions()
        return revisions.get(job)

    def get_skip_text_update_jobs(self) -> List[str]:
        return self.get("skip_text_update_jobs", [])

    def get_cam_email_list(self) -> List[str]:
        return self.get("cam_list", [])

    def get_remote_system(self) -> str:
        return self.get("remote_system", "apclnx01")

    def get_archive_base(self) -> str:
        return self.get("archive_base_path", "/archive")
