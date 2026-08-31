"""
AquaSentinel - PostGIS & SQLAlchemy Database Models
"""

from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from geoalchemy2 import Geometry

Base = declarative_base()

class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(String(64), unique=True, index=True)
    block_name = Column(String(128), index=True)
    district_id = Column(String(64), index=True)
    district_name = Column(String(128))
    state = Column(String(64))
    status = Column(String(32))  # Safe, Semi-Critical, Critical, Over-Exploited, Saline
    baseline_extraction_pct = Column(Float)
    mean_slope_pct = Column(Float)
    geom = Column(Geometry("POLYGON", srid=4326))

    telemetry = relationship("Telemetry", back_populates="block")

class Stream(Base):
    __tablename__ = "streams"

    id = Column(Integer, primary_key=True, index=True)
    stream_id = Column(String(64), index=True)
    stream_order = Column(Integer)
    flow_accumulation = Column(Float)
    geom = Column(Geometry("LINESTRING", srid=4326))

class SlopeGrid(Base):
    __tablename__ = "slopes"

    id = Column(Integer, primary_key=True, index=True)
    slope_pct = Column(Float)
    elevation_m = Column(Float)
    geom = Column(Geometry("POINT", srid=4326))

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(String(64), ForeignKey("blocks.block_id"), index=True)
    date = Column(Date, index=True)
    water_level_mbgl = Column(Float)
    salinity_tds_ppm = Column(Float)
    rainfall_mm = Column(Float, nullable=True)

    block = relationship("Block", back_populates="telemetry")
