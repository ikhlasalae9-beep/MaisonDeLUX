"""Versioned city-specific inference foundation for MaisonDeLUX."""

from .registry import ModelRegistryError, predict_for_city

__all__ = ["ModelRegistryError", "predict_for_city"]
