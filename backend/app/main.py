from fastapi import FastAPI

from app.api.v1.router import api_router

app = FastAPI(title='MediPick API', version='0.1.0')

app.include_router(api_router, prefix='/api/v1')


@app.get('/health')
def health_check():
    return {'success': True, 'data': {'status': 'ok'}}


@app.get('/api/v1')
def api_root():
    return {
        'success': True,
        'data': {
            'message': 'MediPick API is running',
            'version': 'v1',
        },
    }
