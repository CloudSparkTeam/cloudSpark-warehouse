import os
import numpy as np
from PIL import Image
import rasterio
import requests
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

# Usar uma sessão do requests para melhorar a performance
session = requests.Session()

# Lista para armazenar os nomes dos arquivos gerados
nomes_arquivos = []

# Função para baixar as imagens dos ativos
def download_assets(item, outdir):
    """Baixa os ativos TIFF de um item de uma coleção STAC e converte PNG para TIFF se necessário"""
    for band, asset in item.assets.items():
        asset_url = asset.href
        file_extension = asset_url.split('.')[-1]  # Extrai a extensão do arquivo
        
        try:
            if file_extension == 'tif':
                local_path = os.path.join(outdir, f"{item.id}_{band}.tif")
                
                # Baixar o arquivo TIFF
                r = session.get(asset_url)
                r.raise_for_status()  # Verifica se o download teve sucesso
                
                with open(local_path, 'wb') as f:
                    f.write(r.content)
                nomes_arquivos.append(f"{item.id}_{band}.tif")

            elif file_extension == 'png':
                # Baixar o arquivo PNG e converter para TIFF
                r = session.get(asset_url)
                r.raise_for_status()
                
                with Image.open(io.BytesIO(r.content)) as img:
                    tiff_path = os.path.join(outdir, f"{item.id}_{band}.tif")
                    img.save(tiff_path, format='TIFF')
                    nomes_arquivos.append(f"{item.id}_{band}.tif")

        except Exception as e:
            print(f"Erro ao processar {band}: {e}")

# Aumente o limite de pixels para evitar erros com imagens grandes
Image.MAX_IMAGE_PIXELS = None

def ensure_folder_exists(folder_path):
    """Garante que o diretório existe, criando-o, se necessário."""
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

def add_alpha_channel(input_path, output_path):
    """Adiciona um canal alpha a uma imagem TIFF e salva o resultado."""
    try:
        image = Image.open(input_path).convert("RGB")
        image_array = np.array(image)
        alpha_channel = 255 * np.ones((image_array.shape[0], image_array.shape[1], 1), dtype=np.uint8)
        image_with_alpha = np.concatenate((image_array, alpha_channel), axis=2)
        image_with_alpha = Image.fromarray(image_with_alpha, 'RGBA')
        image_with_alpha.save(output_path, 'TIFF')
        print(f"[INFO] Canal alpha adicionado: {output_path}")
    except Exception as e:
        print(f"[ERRO] Falha ao processar {input_path}: {e}")

def process_input_folder(input_folder, output_folder):
    """Processa todas as imagens TIFF em um diretório, adicionando canal alpha."""
    ensure_folder_exists(output_folder)
    for root, _, files in os.walk(input_folder):
        for filename in files:
            if filename.endswith(('.tif', '.tiff')):
                input_path = os.path.join(root, filename)
                output_path = os.path.join(output_folder, f"processed_{filename}")
                add_alpha_channel(input_path, output_path)

def divide_image(image_path, output_dir, divisions=4):
    """Divide uma imagem em partes menores e salva cada parte."""
    try:
        image = Image.open(image_path)
        largura, altura = image.size
        largura_tile = largura // divisions
        altura_tile = altura // divisions

        ensure_folder_exists(output_dir)

        for i in range(divisions):
            for j in range(divisions):
                left = i * largura_tile
                upper = j * altura_tile
                right = (i + 1) * largura_tile
                lower = (j + 1) * altura_tile

                tile = image.crop((left, upper, right, lower))
                tile_path = os.path.join(output_dir, f'tile_{i}_{j}.tif')
                tile.save(tile_path)
                print(f"[INFO] Tile salvo: {tile_path}")
    except Exception as e:
        print(f"[ERRO] Falha ao dividir a imagem {image_path}: {e}")

def enviar_para_ia_e_salvar(input_image_path, output_dir, endpoint="http://192.168.15.12:8000/predict"):
    """Envia uma imagem TIFF para o endpoint da IA e salva o resultado."""
    ensure_folder_exists(output_dir)
    file_name = os.path.basename(input_image_path)
    
    try:
        with open(input_image_path, 'rb') as f:
            files = {'files': (file_name, f, 'image/tiff')}
            response = requests.post(endpoint, files=files, headers={'accept': 'application/json'})
            response.raise_for_status()

            # Salva o resultado da IA
            output_path = os.path.join(output_dir, f'imagem_tratada_ia_{file_name}')
            with open(output_path, 'wb') as out_file:
                out_file.write(response.content)

            print(f"[INFO] Imagem tratada pela IA salva: {output_path}")
    except Exception as e:
        print(f"[ERRO] Falha ao enviar {input_image_path} para IA: {e}")

def juntar_tiles(input_dir, output_path, divisions=4):
    """Junta os tiles processados em uma única imagem TIFF e apaga os tiles usados."""
    try:
        # Obtém os tamanhos dos tiles
        tiles = []
        for i in range(divisions):
            row = []
            for j in range(divisions):
                tile_path = os.path.join(input_dir, f'tile_{i}_{j}.tif')
                if os.path.exists(tile_path):
                    row.append(Image.open(tile_path))
                else:
                    raise FileNotFoundError(f"Tile não encontrado: {tile_path}")
            tiles.append(row)

        # Calcula dimensões da imagem final
        tile_width, tile_height = tiles[0][0].size
        total_width = tile_width * divisions
        total_height = tile_height * divisions

        # Cria uma nova imagem para juntar os tiles
        result_image = Image.new("RGB", (total_width, total_height))

        for i, row in enumerate(tiles):
            for j, tile in enumerate(row):
                result_image.paste(tile, (j * tile_width, i * tile_height))
                tile.close()  # Fecha o arquivo para poder apagar depois

        # Salva a imagem final
        result_image.save(output_path, "TIFF")
        print(f"[INFO] Imagem final salva: {output_path}")

        # Remove os tiles após a junção
        for i in range(divisions):
            for j in range(divisions):
                tile_path = os.path.join(input_dir, f'tile_{i}_{j}.tif')
                if os.path.exists(tile_path):
                    os.remove(tile_path)
                    print(f"[INFO] Tile removido: {tile_path}")
    except Exception as e:
        print(f"[ERRO] Falha ao juntar os tiles: {e}")

# Função principal para execução
def main():
    # Defina os caminhos das pastas de entrada e saída
    input_folder = 'imagens_tratadas/'  # Pasta de entrada com imagens TIFF
    output_folder = 'img4canal/'  # Pasta de saída para salvar as imagens com o canal alpha
    tiles_folder = 'img_tiles/'
    ia_output_folder = 'imagens_tratadas_ia/'
    ia_output_folder_compile = 'imagens_tratadas_ia_compile/'

    # Lista de pastas que precisam ser verificadas/criadas
    folders = [input_folder, output_folder, tiles_folder, ia_output_folder, ia_output_folder_compile]

    # Verifica e cria as pastas, se não existirem
    for folder in folders:
        if not os.path.exists(folder):
            os.makedirs(folder)

    # Baixar produtos
    for produto in produtos:
        download_assets(produto, outdir)

    # Aplica 4 Camadas
    for filename in os.listdir(tiles_folder):
        if filename.endswith('.tif') or filename.endswith('.tiff'):  # Verifica se é um arquivo TIFF
            input_path = os.path.join(tiles_folder, filename)
            output_path = os.path.join(output_folder, f"processed_{filename}")

            # Processa e salva a imagem
            add_alpha_channel(input_path, output_path)

    # Dividir imagens processadas
    for filename in os.listdir(input_folder):
        if filename.endswith('.tif'):
            image_path = os.path.join(input_folder, filename)
            divide_image(image_path, tiles_folder)

    # Enviar os tiles para a IA
    for filename in os.listdir(output_folder):
        if filename.endswith('.tif'):
            tile_path = os.path.join(output_folder, filename)
            enviar_para_ia_e_salvar(tile_path, ia_output_folder_compile)

    juntar_tiles(ia_output_folder_compile, ia_output_folder)
    

if __name__ == "__main__":
    main()
