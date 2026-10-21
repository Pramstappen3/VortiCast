"""Geospatial utilities for great-circle distance, bearings, and track motion."""

import math


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the great-circle distance in kilometers between two points on the Earth's surface."""
    radius_earth_km = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(radius_earth_km * c, 2)


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the initial compass bearing (0-360 degrees) from point 1 to point 2."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)

    initial_bearing = math.degrees(math.atan2(y, x))
    compass_bearing = (initial_bearing + 360.0) % 360.0
    return round(compass_bearing, 2)


def calculate_speed_kmh(distance_km: float, time_elapsed_hours: float) -> float | None:
    """Calculates forward translation speed in km/h."""
    if time_elapsed_hours <= 0:
        return None
    return round(distance_km / time_elapsed_hours, 2)
