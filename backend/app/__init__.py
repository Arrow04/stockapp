"""StockApp backend - layered application package.

Layers (dependencies point inwards only):
    api -> services -> repositories -> core
    config is the single source of environment configuration.
    data holds third-party market-data adapters.
"""
