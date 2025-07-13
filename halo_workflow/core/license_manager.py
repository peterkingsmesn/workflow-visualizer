"""
라이선스 관리자
"""

import json
import requests
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class LicenseManager:
    """라이선스 검증 및 관리"""
    
    def __init__(self):
        self.config_dir = Path.home() / '.halo-workflow'
        self.config_dir.mkdir(exist_ok=True)
        self.license_file = self.config_dir / 'license.json'
        self.api_url = 'https://api.halo-workflow.com/verify'
        self._cache = None
    
    def is_premium(self) -> bool:
        """프리미엄 버전인지 확인"""
        license_data = self._load_license()
        
        if not license_data:
            return False
        
        # 온라인 검증 시도
        if self._verify_online(license_data.get('key')):
            return True
        
        # 오프라인 캐시 확인
        return self._verify_offline(license_data)
    
    def activate(self, license_key: str) -> bool:
        """라이선스 활성화"""
        try:
            # 온라인 검증
            response = requests.post(
                self.api_url,
                json={'key': license_key},
                timeout=10
            )
            
            if response.ok:
                data = response.json()
                if data.get('valid'):
                    # 라이선스 저장
                    license_data = {
                        'key': license_key,
                        'activated_at': datetime.now().isoformat(),
                        'expire_date': data.get('expire_date'),
                        'plan': data.get('plan', 'pro'),
                        'last_verified': datetime.now().isoformat()
                    }
                    self._save_license(license_data)
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"라이선스 활성화 오류: {e}")
            return False
    
    def get_status(self) -> Dict[str, Any]:
        """라이선스 상태 반환"""
        license_data = self._load_license()
        
        if not license_data:
            return {
                'is_premium': False,
                'license_key': None,
                'expire_date': None,
                'plan': 'free'
            }
        
        return {
            'is_premium': self.is_premium(),
            'license_key': license_data.get('key'),
            'expire_date': license_data.get('expire_date'),
            'plan': license_data.get('plan', 'pro')
        }
    
    def _verify_online(self, license_key: Optional[str]) -> bool:
        """온라인 라이선스 검증"""
        if not license_key:
            return False
        
        try:
            response = requests.post(
                self.api_url,
                json={'key': license_key},
                timeout=5
            )
            
            if response.ok:
                data = response.json()
                if data.get('valid'):
                    # 캐시 업데이트
                    license_data = self._load_license()
                    if license_data:
                        license_data['last_verified'] = datetime.now().isoformat()
                        license_data['expire_date'] = data.get('expire_date')
                        self._save_license(license_data)
                    return True
            
            return False
            
        except Exception:
            # 네트워크 오류 시 오프라인 모드로
            return False
    
    def _verify_offline(self, license_data: Dict[str, Any]) -> bool:
        """오프라인 라이선스 검증"""
        # 마지막 검증으로부터 7일 이내면 유효하다고 간주
        last_verified = license_data.get('last_verified')
        if not last_verified:
            return False
        
        try:
            last_verified_date = datetime.fromisoformat(last_verified)
            if datetime.now() - last_verified_date < timedelta(days=7):
                # 만료일 체크
                expire_date = license_data.get('expire_date')
                if expire_date:
                    expire_datetime = datetime.fromisoformat(expire_date)
                    return datetime.now() < expire_datetime
                return True
        except Exception:
            return False
        
        return False
    
    def _load_license(self) -> Optional[Dict[str, Any]]:
        """라이선스 파일 로드"""
        if self._cache:
            return self._cache
        
        if self.license_file.exists():
            try:
                with open(self.license_file) as f:
                    self._cache = json.load(f)
                    return self._cache
            except Exception:
                pass
        
        return None
    
    def _save_license(self, license_data: Dict[str, Any]):
        """라이선스 파일 저장"""
        try:
            with open(self.license_file, 'w') as f:
                json.dump(license_data, f, indent=2)
            self._cache = license_data
        except Exception as e:
            logger.error(f"라이선스 저장 오류: {e}")