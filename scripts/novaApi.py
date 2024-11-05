import os
import sys
from pystac_client import Client
import requests
from PIL import Image
import io

# Definir o ponto de entrada da API STAC do INPE
STAC_API_URL = "https://data.inpe.br/bdc/stac/v1/"
catalogo = Client.open(STAC_API_URL)

# Definir o bounding box e intervalo de datas a partir dos argumentos de linha de comando
lon_min, lat_min, lon_max, lat_max = map(float, sys.argv[1:5])
start_date_str, end_date_str = sys.argv[5], sys.argv[6]
bounding_box = [lon_min, lat_min, lon_max, lat_max]

# Exibindo as informações recebidas
print(f"Bounding Box: [{lon_min}, {lat_min}, {lon_max}, {lat_max}]")
print(f"Data Inicial: {start_date_str}")
print(f"Data Final: {end_date_str}")

# Consultar a coleção CBERS-4 WPM usando a API STAC
colecao_id = 'CB4A-WPM-PCA-FUSED-1'
print("Consultando produtos na API STAC...")

try:
    search = catalogo.search(
        collections=[colecao_id],
        bbox=bounding_box,
        datetime=f"{start_date_str}/{end_date_str}",
        limit=5
    )
    produtos = list(search.items())
    print(f"Produtos encontrados: {len(produtos)}")
except Exception as e:
    print(f"Erro ao buscar produtos: {e}")
    sys.exit(1)

if not produtos:
    print("Nenhum produto encontrado ou ocorreu um erro durante a consulta.")
    sys.exit(1)

# Diretório de saída como a pasta "imagens_tratadas"
outdir = os.path.join(os.getcwd(), 'imagens_tratadas')
os.makedirs(outdir, exist_ok=True)
print(f"Pasta de saída: {outdir}")

# Usar uma sessão do requests para melhorar a performance
session = requests.Session()

# Função para baixar as imagens dos ativos
def download_assets(item, outdir):
    """Baixa os ativos TIFF de um item de uma coleção STAC e converte PNG para TIFF se necessário"""
    print(f"Baixando ativos do item: {item.id}")
    for band, asset in item.assets.items():
        asset_url = asset.href
        file_extension = asset_url.split('.')[-1]  # Extrai a extensão do arquivo
        
        try:
            if file_extension == 'tif':
                local_path = os.path.join(outdir, f"{item.id}_{band}.tif")
                print(f"Baixando TIFF: {band} de {asset_url}")
                
                # Baixar o arquivo TIFF
                r = session.get(asset_url)
                r.raise_for_status()  # Verifica se o download teve sucesso
                
                with open(local_path, 'wb') as f:
                    f.write(r.content)
                print(f"Download concluído: {local_path}")

            elif file_extension == 'png':
                print(f"Processando PNG: {band} de {asset_url}")
                
                # Baixar o arquivo PNG
                r = session.get(asset_url)
                r.raise_for_status()
                
                # Converter o PNG para TIFF diretamente da memória
                with Image.open(io.BytesIO(r.content)) as img:
                    tiff_path = os.path.join(outdir, f"{item.id}_{band}.tif")
                    img.save(tiff_path, format='TIFF')
                    print(f"Conversão concluída: {tiff_path}")

        except Exception as e:
            print(f"Erro ao processar {band}: {e}")

# Baixar produtos
for produto in produtos:
    download_assets(produto, outdir)

print("Processo concluído.")

# Agora vamos imprimir os nomes dos arquivos gerados
for item in produtos:
    for band in item.assets.keys():
        print(f"{item.id}_{band}.tif")  # Imprime o nome do arquivo