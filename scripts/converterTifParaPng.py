import os
from PIL import Image
import rioxarray
from osgeo import gdal

# Caminhos de entrada e saída
input_dir = "C:/API/cloudSpark-warehouse/imagens_tratadas_ia"
output_dir = "C:/API/cloudSpark-warehouse/imagens_tratadas_png"
output_format = "PNG"  # ou "JPEG"

# Cria a pasta de saída, se não existir
os.makedirs(output_dir, exist_ok=True)


def convert_tiff_to_image_rioxarray(input_path, output_path, format="PNG"):
    # Carrega o arquivo TIFF
    dataset = rioxarray.open_rasterio(input_path)
    
    # Converte para uma matriz NumPy e normaliza
    array = dataset.values
    normalized_array = (255 * (array - array.min()) / (array.max() - array.min())).astype("uint8")

    # Converte para imagem PIL e salva no formato desejado
    img = Image.fromarray(normalized_array)
    img.save(output_path, format=format)

# Percorre todos os arquivos TIFF na pasta
for file_name in os.listdir(input_dir):
    if file_name.endswith(".tiff") or file_name.endswith(".tif"):
        input_path = os.path.join(input_dir, file_name)
        output_path = os.path.join(output_dir, f"{os.path.splitext(file_name)[0]}.{output_format.lower()}")
        convert_tiff_to_image_rioxarray(input_path, output_path, format=output_format)
        print(f"Convertido: {file_name} para {output_path}")
