"""
AquaSentinel / JalNetra - SQLAlchemy Database Models
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base

class District(Base):
    __tablename__ = "districts"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    state = Column(String(128), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    cgwb_classification = Column(String(64), nullable=False)
    is_coastal = Column(Boolean, default=False)
    extraction_trend = Column(String(32), default="rising")
    gw_trend = Column(String(32), default="declining")
    base_level = Column(Float, default=15.0)

    # Relationships
    readings = relationship("GroundwaterReading", back_populates="district", cascade="all, delete-orphan", order_by="GroundwaterReading.month")
    recharge_sites = relationship("RechargeSite", back_populates="district", cascade="all, delete-orphan")


class GroundwaterReading(Base):
    __tablename__ = "groundwater_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    district_id = Column(String(64), ForeignKey("districts.id"), nullable=False, index=True)
    month = Column(String(7), nullable=False, index=True)  # Format: 'YYYY-MM'
    value = Column(Float, nullable=False)                   # Water level in mbgl
    rainfall_deficit_pct = Column(Integer, default=0)
    salinity_risk_score = Column(Integer, nullable=True)

    district = relationship("District", back_populates="readings")

    __table_args__ = (
        Index("ix_district_month", "district_id", "month", unique=True),
    )


class RechargeSite(Base):
    __tablename__ = "recharge_sites"

    id = Column(String(64), primary_key=True)
    district_id = Column(String(64), ForeignKey("districts.id"), nullable=False, index=True)
    site_type = Column(String(64), nullable=False)  # Check Dam, Percolation Pond, etc.
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    suitability_score = Column(Float, nullable=False)
    estimated_recharge_m3 = Column(Integer, default=15000)
    estimated_cost_lakhs = Column(Float, default=25.0)
    priority = Column(String(16), default="Medium")

    district = relationship("District", back_populates="recharge_sites")

