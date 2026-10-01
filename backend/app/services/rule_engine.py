"""
Rule-based outfit matching engine.
Filters wardrobe by style/occasion/season, then assembles outfit combos.
"""

_NEUTRALS = frozenset({
    "black", "white", "grey", "gray", "beige", "ivory", "cream",
    "off-white", "nude", "brown", "tan", "camel", "navy", "charcoal", "khaki",
})

def filter_items(items: list[dict], style_type: str, occasion: str, season: str = "all") -> list[dict]:
    """
    Filter wardrobe items by style, occasion, and season.
    Falls back to relaxed filter if < 2 items pass strict filter.
    """
    def _strict(item: dict) -> bool:
        return (
            style_type in (item.get("style_type") or [])
            and (occasion in (item.get("occasion") or []) or "all" in (item.get("occasion") or []))
            and (season in (item.get("season") or ["all"]) or "all" in (item.get("season") or ["all"]))
        )

    def _relaxed(item: dict) -> bool:
        return (style_type in (item.get("style_type") or []) or occasion in (item.get("occasion") or []))

    strict = [i for i in items if _strict(i)]
    return strict if len(strict) >= 2 else [i for i in items if _relaxed(i)]

def build_outfit_combinations(items: list[dict], max_outfits: int = 1, excluded_combos: list[str] = None, locked_items: list[str] = None) -> list[list[dict]]:
    """
    Assemble outfit combinations from filtered items.
    Skips combos whose hash is in excluded_combos.
    If locked_items are provided, forces combinations to include them by clearing out other items in their categories.
    """
    if excluded_combos is None:
        excluded_combos = []
    if locked_items is None:
        locked_items = []
        
    excluded_set = set(excluded_combos)
    locked_set = set(locked_items)
    
    def get_combo_hash(combo: list[dict]) -> str:
        return "-".join(sorted(item["id"] for item in combo))

    by_cat: dict[str, list[dict]] = {}
    for item in items:
        by_cat.setdefault(item.get("category", "accessory"), []).append(item)

    # Apply locking logic: if a category contains a locked item, KEEP ONLY the locked item(s) in that category
    for cat, cat_items in by_cat.items():
        locked_in_cat = [i for i in cat_items if i["id"] in locked_set]
        if locked_in_cat:
            by_cat[cat] = locked_in_cat

    outfits: list[list[dict]] = []

    def add_combo_if_valid(combo: list[dict]) -> bool:
        combo_hash = get_combo_hash(combo)
        if combo_hash not in excluded_set:
            outfits.append(combo)
            return True
        return False

    # Strategy 1: full-outfit
    for fo in by_cat.get("full-outfit", []):
        combo = [fo]
        for acc_cat in ("dupatta", "footwear", "accessory"):
            if by_cat.get(acc_cat):
                combo.append(by_cat[acc_cat][0])
                break
        if add_combo_if_valid(combo) and len(outfits) >= max_outfits:
            return outfits

    # Strategy 2: top + bottom
    tops = by_cat.get("top", [])
    bottoms = by_cat.get("bottom", [])
    for top in tops:
        for bottom in bottoms:
            combo = [top, bottom]
            if add_combo_if_valid(combo) and len(outfits) >= max_outfits:
                return outfits

    return outfits[:max_outfits]
