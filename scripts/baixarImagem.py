import os
import sys
from cbers4asat import Cbers4aAPI
from datetime import date
import rasterio
import numpy as np
import matplotlib.pyplot as plt
import requests
from PIL import Image  # Importando a biblioteca Pillow


Image.MAX_IMAGE_PIXELS = None  # Remove o limite de pixels

# Substitua pelo seu email cadastrado na API
api = Cbers4aAPI('vitaoog@gmail.com')

# Definindo o bounding box
lon_min, lat_min, lon_max, lat_max = map(float, sys.argv[1:5])
start_date_str, end_date_str = sys.argv[5], sys.argv[6]
bounding_box = [lon_min, lat_min, lon_max, lat_max]

# Exibindo as informações recebidas
print(f"Bounding Box: [{lon_min}, {lat_min}, {lon_max}, {lat_max}]")
print(f"Data Inicial: {start_date_str}")
print(f"Data Final: {end_date_str}")

# Definindo as datas
data_inicial = date.fromisoformat(start_date_str)
data_final = date.fromisoformat(end_date_str)

# Buscando os produtos com o bounding box
produtos = None
try:
    produtos = api.query(location=bounding_box,
                         initial_date=data_inicial,
                         end_date=data_final,
                         cloud=100,
                         limit=5,
                         collections=['CBERS4A_WPM_L4_DN'])
except Exception as e:
    print(f"Erro ao buscar produtos: {e}")

if produtos is None:
    print("Nenhum produto encontrado ou ocorreu um erro durante a consulta.")
    sys.exit(1)

# Definindo as bandas que você deseja baixar
bands = ['red', 'green', 'blue', 'nir']

# Diretório de saída como o diretório atual
outdir = os.getcwd()

# Diretório para salvar os arquivos PNG
output_dir = os.path.join(outdir, 'imagens_tratadas')
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Diretório para salvar as imagens tratadas pela IA
ia_output_dir = os.path.join(outdir, 'imagens_tratadas_ia')
if not os.path.exists(ia_output_dir):
    os.makedirs(ia_output_dir)

# Baixando os produtos
try:
    api.download(products=produtos, 
                 bands=bands, 
                 threads=3, 
                 outdir=outdir, 
                 with_folder=True)
    print("Download das imagens concluído")
except Exception as e:
    print(f"Erro ao baixar produtos: {e}")
    sys.exit(1)

# Função para aplicar histogram stretching
def stretch_image(image, lower_percent=2, upper_percent=98):
    """Aplica stretching no histograma para melhorar o contraste."""
    out = np.zeros_like(image, dtype=np.float32)
    for i in range(image.shape[-1]):
        band = image[:, :, i]
        lower = np.percentile(band, lower_percent)
        upper = np.percentile(band, upper_percent)
        out[:, :, i] = np.clip((band - lower) / (upper - lower), 0, 1)
    return out

# Função para enviar a imagem para o endpoint e salvar a resposta
def enviar_para_ia_e_salvar(output_png_path, ia_output_dir):
    files = {'file': open(output_png_path, 'rb')}
    try:
        response = requests.post('http://50.17.138.118:8000/predict', files=files)
        response.raise_for_status()

        # Salvar a imagem retornada
        treated_image_path = os.path.join(ia_output_dir, f'imagem_tratada_ia_{os.path.basename(output_png_path)}')
        with open(treated_image_path, 'wb') as f:
            f.write(response.content)
        
        print(f"Imagem tratada salva como {treated_image_path}")
    
    except requests.exceptions.RequestException as e:
        print(f"Erro ao enviar ou receber a imagem tratada: {e}")

# Verificando o conteúdo do diretório de download para encontrar as subpastas
for subdir in os.listdir(outdir):
    subdir_path = os.path.join(outdir, subdir)

    # Verificar se o diretório é uma pasta e contém arquivos .tif
    if os.path.isdir(subdir_path) and subdir.startswith('CBERS'):
        print(f"Processando a pasta: {subdir_path}")

        # Procurar automaticamente pelas bandas nas subpastas
        band_paths = []
        for file in os.listdir(subdir_path):
            if file.endswith('.tif') and any(band in file for band in ['BAND1', 'BAND2', 'BAND3', 'BAND4']):
                band_paths.append(os.path.join(subdir_path, file))

        if len(band_paths) < 4:
            print(f"Erro: Não foram encontradas todas as 4 bandas na pasta {subdir_path}.")
            continue

        # Lista para armazenar as bandas lidas
        bands_data = []

        # Abrir cada banda e adicionar à lista
        for path in band_paths:
            with rasterio.open(path) as src:
                bands_data.append(src.read(1))

        # Empilhando as bandas
        stacked_bands = np.stack(bands_data, axis=-1)

        # Normalizando as bandas individualmente
        rgb_image = np.zeros_like(stacked_bands, dtype=np.float32)
        for i in range(stacked_bands.shape[-1]):
            band = stacked_bands[:, :, i]
            min_val = np.min(band)
            max_val = np.max(band)
            rgb_image[:, :, i] = (band - min_val) / (max_val - min_val)  # Normalizando banda por banda

        # Aplicar stretching para melhorar o contraste
        stretched_image = stretch_image(rgb_image)

        # Nome de saída baseado na pasta
        output_png_path = os.path.join(output_dir, f'{subdir}_imagem_empilhada.png')

        # Salvando a imagem com stretching aplicado
        plt.imsave(output_png_path, stretched_image)

        print(f"Imagem empilhada salva como {output_png_path}")

        # Redimensionando a imagem
        with Image.open(output_png_path) as img:
            img = img.resize((800, 600), Image.ANTIALIAS)  # Ajuste o tamanho conforme necessário
            img.save(output_png_path)

        # Enviar a imagem para o endpoint e salvar a resposta
        enviar_para_ia_e_salvar(output_png_path, ia_output_dir)