"""
Date Code Calculator
Translates all the date code format logic from output_ldi_files.
Supports all formats found in the original script plus auto-detection.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any


# IBM YMD encoding tables
IBM_MONTHS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C"]
IBM_DAYS = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "A", "B", "C", "D", "E", "F", "G", "H", "J",
    "K", "L", "M", "N", "P", "R", "S", "T", "V",
    "W", "X", "Y", "Z"
]


def calculate_date_code(
    fmt: str,
    dt: Optional[datetime] = None,
    manual_value: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Calculate a date code in the given format.

    Args:
        fmt: Date code format string (e.g. "WWYY", "YYYY-MM-DD", "YMD", etc.)
        dt: DateTime to use (defaults to now)
        manual_value: If provided, use this value instead of calculating

    Returns:
        Dict with 'code', 'format', 'auto' flag, and 'needs_manual' flag
    """
    if manual_value:
        return {
            "code": manual_value,
            "format": fmt,
            "auto": False,
            "needs_manual": False,
        }

    if dt is None:
        dt = datetime.now()

    year4 = dt.strftime("%Y")
    year2 = dt.strftime("%y")
    year1 = year2[-1]
    month2 = dt.strftime("%m")
    month_int = dt.month
    day2 = dt.strftime("%d")
    day_of_year = dt.strftime("%j")

    # ISO week number (matching %V behavior, with the corrections from the script)
    iso_year, iso_week, _ = dt.isocalendar()
    week = iso_week

    # Apply the same corrections as the original script
    if week > 52 and month_int != 1:
        week -= 1
    elif week >= 52 and month_int == 1:
        week = 1
    elif week == 1 and month_int == 12:
        week = 52

    week2 = f"{week:02d}"

    # Strip leading zeros for single-digit representations
    month_no_lead = str(month_int)
    year_no_lead = year2.lstrip("0") or "0"

    code = None
    needs_manual = False

    fmt_upper = fmt.upper() if fmt else ""

    if fmt_upper == "WWYY":
        code = f"{week2}{year2}"
    elif fmt_upper == "WW-YY":
        code = f"{week2}-{year2}"
    elif fmt_upper == "WW/YY":
        code = f"{week2}/{year2}"
    elif fmt_upper == "YYWW":
        code = f"{year2}{week2}"
    elif fmt_upper == "YY-WW":
        code = f"{year2}-{week2}"
    elif fmt_upper == "YY/WW":
        code = f"{year2}/{week2}"
    elif fmt_upper == "MMYY":
        code = f"{month2}{year2}"
    elif fmt_upper == "YYMM":
        code = f"{year2}{month2}"
    elif fmt_upper == "YYYYMM":
        code = f"{year4}{month2}"
    elif fmt_upper == "YYYY-MM-DD":
        code = f"{year4}-{month2}-{day2}"
    elif fmt_upper == "YYYYMMDD":
        code = f"{year4}{month2}{day2}"
    elif fmt_upper == "YYYYWW":
        code = f"{year4}{week2}"
    elif fmt_upper == "YYYY-WW":
        code = f"{year4}-{week2}"
    elif fmt_upper == "YYMMDD":
        code = f"{year2}{month2}{day2}"
    elif fmt_upper == "YYYY-DD-MM":
        code = f"{year4}-{day2}-{month2}"
    elif fmt_upper == "WWY":
        code = f"{week2}{year1}"
    elif fmt_upper == "YWW":
        code = f"{year1}{week2}"
    elif fmt_upper == "MMY":
        code = f"{month_no_lead}{year1}"
    elif fmt_upper == "MM-Y":
        code = f"{month_no_lead}-{year1}"
    elif fmt_upper == "YMM":
        code = f"{year1}{month_no_lead}"
    elif fmt_upper == "YMD":
        # IBM date code encoding
        ibm_month = IBM_MONTHS[month_int - 1]
        day_int = int(day2)
        if 1 <= day_int <= len(IBM_DAYS):
            ibm_day = IBM_DAYS[day_int - 1]
        else:
            ibm_day = "?"
        code = f"{year1}{ibm_month}{ibm_day}"
    elif fmt_upper == "MM/DD/YYYY":
        code = f"{month2}/{day2}/{year4}"
    elif fmt_upper == "WW/YYYY":
        code = f"{week2}/{year4}"
    elif fmt_upper == "YYDDD":
        code = f"{year2}{day_of_year}"
        # This format typically needs manual confirmation
        needs_manual = True
    elif fmt_upper == "DDDYY":
        code = f"{day_of_year}{year2}"
        needs_manual = True
    elif fmt_upper in ("X", "", "NONE", "MANUAL"):
        code = "none"
        needs_manual = False
    else:
        # Unknown format - needs manual entry
        code = None
        needs_manual = True

    return {
        "code": code,
        "format": fmt,
        "auto": not needs_manual and code is not None,
        "needs_manual": needs_manual,
        "today": dt.strftime("%Y-%m-%d"),
        "day_of_year": int(day_of_year),
        "week": int(week2),
    }


def get_supported_formats() -> list:
    """Return list of all supported date code formats."""
    return [
        "WWYY", "WW-YY", "WW/YY", "YYWW", "YY-WW", "YY/WW",
        "MMYY", "YYMM", "YYYYMM", "YYYY-MM-DD", "YYYYMMDD",
        "YYYYWW", "YYYY-WW", "YYMMDD", "YYYY-DD-MM", "WWY",
        "YWW", "MMY", "MM-Y", "YMM", "YMD", "MM/DD/YYYY",
        "WW/YYYY", "YYDDD", "DDDYY",
    ]
