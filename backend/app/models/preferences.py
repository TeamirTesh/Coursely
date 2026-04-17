"""Pydantic models for persistent optimizer preferences."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TimePreferenceRow(BaseModel):
    id: int
    day: str
    time_slot: str
    preference: int = Field(ge=0, le=2)
    updated_at: datetime


class TimePreferencePut(BaseModel):
    day: str
    time_slot: str
    preference: int = Field(ge=0, le=2)


class OptimizerWeightsRow(BaseModel):
    id: int
    professor_rating_weight: int = Field(ge=0, le=100)
    compactness_weight: int = Field(ge=0, le=100)
    time_preference_weight: int = Field(ge=0, le=100)
    preferred_compactness: int = Field(ge=0, le=100)
    updated_at: datetime


class OptimizerWeightsPut(BaseModel):
    professor_rating_weight: int = Field(ge=0, le=100)
    compactness_weight: int = Field(ge=0, le=100)
    time_preference_weight: int = Field(ge=0, le=100)
    preferred_compactness: int = Field(ge=0, le=100)
