import os
import sys
from pystac_client import Client
from datetime import date
import rasterio
import numpy as np
import requests
from PIL import Image

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

# Definindo as bandas que você deseja baixar
bands = ['thumbnail', 'tci']  # Exemplo de bandas disponíveis na coleção

# Diretório de saída como a pasta "imagens_tratadas"
outdir = os.path.join(os.getcwd(), 'imagens_tratadas')

# Verificar se o diretório "imagens_tratadas" existe, se não, criar
if not os.path.exists(outdir):
    os.makedirs(outdir)
    print(f"Pasta criada: {outdir}")
else:
    print(f"Pasta já existe: {outdir}")

# Diretório para salvar as imagens tratadas pela IA
ia_output_dir = os.path.join(os.getcwd(), 'imagens_tratadas_ia')
if not os.path.exists(ia_output_dir):
    os.makedirs(ia_output_dir)
    print(f"Pasta criada: {ia_output_dir}")
else:
    print(f"Pasta já existe: {ia_output_dir}")

# Função para baixar as imagens dos ativos
def download_assets(item, bands, outdir):
    """Baixa os ativos do item de uma coleção STAC e salva em TIFF e PNG"""
    print(f"Baixando ativos do item: {item.id}")
    for band in bands:
        if band in item.assets:
            asset_url = item.assets[band].href
            file_extension = asset_url.split('.')[-1]  # Extrai a extensão do arquivo
            local_path = os.path.join(outdir, f"{item.id}_{band}.{file_extension}")
            
            print(f"Baixando {band} de {asset_url}")
            try:
                # Baixar o arquivo
                r = requests.get(asset_url)
                with open(local_path, 'wb') as f:
                    f.write(r.content)
                print(f"Download concluído: {local_path}")

                # Se o arquivo baixado for TIFF, converter para PNG
                if file_extension == 'tif':
                    png_path = local_path.replace('.tif', '.png')
                    convert_tiff_to_png(local_path, png_path)
                # Se o arquivo baixado for PNG, converter para TIFF
                elif file_extension == 'png':
                    tiff_path = local_path.replace('.png', '.tif')
                    convert_png_to_tiff(local_path, tiff_path)
                else:
                    print(f"Formato {file_extension} não suportado para {band}")

            except Exception as e:
                print(f"Erro ao baixar {band}: {e}")

# Função para converter TIFF para PNG
def convert_tiff_to_png(tiff_path, png_path):
    """Converte um arquivo TIFF em PNG usando Pillow"""
    try:
        print(f"Convertendo {tiff_path} para {png_path}")
        with Image.open(tiff_path) as img:
            img.save(png_path, format='PNG')
        print(f"Conversão concluída: {png_path}")
    except Exception as e:
        print(f"Erro ao converter {tiff_path} para PNG: {e}")

# Função para converter PNG para TIFF
def convert_png_to_tiff(png_path, tiff_path):
    """Converte um arquivo PNG em TIFF usando Pillow"""
    try:
        print(f"Convertendo {png_path} para {tiff_path}")
        with Image.open(png_path) as img:
            img.save(tiff_path, format='TIFF')
        print(f"Conversão concluída: {tiff_path}")
    except Exception as e:
        print(f"Erro ao converter {png_path} para TIFF: {e}")

# Função para enviar a imagem PNG para o endpoint e salvar a resposta
def enviar_para_ia_e_salvar(png_path, ia_output_dir):
    """Envia uma imagem PNG para o endpoint de IA e salva a resposta"""
    with open(png_path, 'rb') as f:
        # Criando o payload de arquivo
        files = {'file': (os.path.basename(png_path), f, 'image/png')}
        headers = {'accept': 'application/json'}

        try:
            # Fazendo a requisição para o endpoint
            response = requests.post('http://50.17.138.118:8000/predict', files=files, headers=headers)
            response.raise_for_status()

            # Salvando a imagem retornada
            ia_output_path = os.path.join(ia_output_dir, f"imagens_tratadas_ia_{os.path.basename(png_path)}")
            with open(ia_output_path, 'wb') as f_out:
                f_out.write(response.content)

            print(f"Imagem tratada salva como {ia_output_path}")

        except requests.exceptions.RequestException as e:
            print(f"Erro ao enviar ou receber a imagem tratada: {e}")

# Baixar produtos
for produto in produtos:
    download_assets(produto, bands, outdir)

print("Processo concluído.")