import os
import sys
from pystac_client import Client
from datetime import date
import requests

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

# Definindo as datas
data_inicial = start_date_str
data_final = end_date_str

# Consultar a coleção CBERS-4 WPM usando a API STAC
colecao_id = 'CB4A-WPM-PCA-FUSED-1'
print("Consultando produtos na API STAC...")

try:
    search = catalogo.search(
        collections=[colecao_id],
        bbox=bounding_box,
        datetime=f"{data_inicial}/{data_final}",
        limit=5
    )
    produtos = search.items()  # Usar o método correto
    produtos = list(produtos)
    print(f"Produtos encontrados: {len(produtos)}")
except Exception as e:
    print(f"Erro ao buscar produtos: {e}")
    sys.exit(1)

if not produtos:
    print("Nenhum produto encontrado ou ocorreu um erro durante a consulta.")
    sys.exit(1)

# Definindo as bandas que você deseja baixar (somente 'thumbnail' e 'tci' como PNG)
bands = ['thumbnail', 'tci']  # Exemplo de bandas disponíveis na coleção

# Diretório de saída como o diretório atual
outdir = os.getcwd()

# Função para baixar as imagens dos ativos
def download_assets(item, bands, outdir):
    """Baixa os ativos do item de uma coleção STAC e salva em PNG"""
    print(f"Baixando ativos do item: {item.id}")
    for band in bands:
        if band in item.assets:
            asset_url = item.assets[band].href
            file_extension = asset_url.split('.')[-1]  # Extrai a extensão do arquivo
            local_path = os.path.join(outdir, f"{item.id}_{band}.{file_extension}")
            
            print(f"Baixando {band} de {asset_url}")
            try:
                # Adiciona timeout para evitar travamentos
                r = requests.get(asset_url, timeout=60)  # Timeout de 60 segundos
                if r.status_code == 200:  # Verifica se o download foi bem-sucedido
                    with open(local_path, 'wb') as f:
                        f.write(r.content)
                    print(f"Download concluído: {local_path}")
                else:
                    print(f"Erro ao baixar {band}: Status Code {r.status_code}")
            except Exception as e:
                print(f"Erro ao baixar {band}: {e}")

# Baixar produtos
for produto in produtos:
    try:
        download_assets(produto, bands, outdir)
    except Exception as e:
        print(f"Erro ao processar produto {produto.id}: {e}")

print("Processo concluído.")
