from typing import Optional
from pydantic import BaseModel


class Course(BaseModel):
    id: int
    course_code: str
    title: str
    credits: Optional[int]
    department: Optional[str]


class Section(BaseModel):
    id: int
    crn: str
    course_code: str
    title: str
    semester: str
    professor: Optional[str]
    professor_id: Optional[int]
    overall_rating: Optional[float]
    adjusted_rating: Optional[float]
    difficulty: Optional[float]
    meeting_days: Optional[list[str]]
    start_time: Optional[str]
    end_time: Optional[str]
    location: Optional[str]
    capacity: Optional[int]
    enrolled: Optional[int]
