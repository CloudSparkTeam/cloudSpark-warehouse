import os
import sys
from cbers4asat import Cbers4aAPI
from datetime import date
import rasterio
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

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

# Diretório para salvar os arquivos TIFF combinados
output_dir = os.path.join(outdir, 'imagens_tratadas')
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

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
def stretch_image(image, lower_percent=1, upper_percent=99):
    """Aplica stretching no histograma para melhorar o contraste."""
    out = np.zeros_like(image, dtype=np.float32)
    for i in range(image.shape[-1]):
        band = image[:, :, i]
        lower = np.percentile(band, lower_percent)
        upper = np.percentile(band, upper_percent)
        out[:, :, i] = np.clip((band - lower) / (upper - lower), 0, 1)
    return out

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
        output_tif_path = os.path.join(output_dir, f'{subdir}_imagem_empilhada_combinada.tif')

        # Salvando a imagem empilhada combinada como um único arquivo TIFF
        with rasterio.open(
            output_tif_path, 'w',
            driver='GTiff',
            height=stretched_image.shape[0],
            width=stretched_image.shape[1],
            count=stretched_image.shape[2],
            dtype=stretched_image.dtype
        ) as dst:
            for i in range(stretched_image.shape[2]):
                dst.write(stretched_image[:, :, i], i + 1)

        print(f"Imagem empilhada combinada salva como {output_tif_path}")
