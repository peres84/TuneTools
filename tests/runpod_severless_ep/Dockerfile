FROM runpod/pytorch:2.2.0-py3.10-cuda12.1.1-devel-ubuntu22.04

# 1. Install system dependencies + git-lfs
RUN apt-get update && apt-get install -y \
    git \
    git-lfs \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 2. Initialize Git LFS
RUN git lfs install

# Install core Python dependencies
RUN pip install --no-cache-dir \
    transformers==4.36.0 \
    accelerate==0.25.0 \
    bitsandbytes==0.41.3 \
    runpod==1.6.2 \
    huggingface_hub \
    sentencepiece \
    soundfile \
    librosa \
    numpy \
    scipy \
    torchaudio \
    einops \
    protobuf \
    packaging

# Install flash-attention
RUN pip install --no-cache-dir \
    https://github.com/Dao-AILab/flash-attention/releases/download/v2.7.4.post1/flash_attn-2.7.4.post1+cu12torch2.2cxx11abiFALSE-cp310-cp310-linux_x86_64.whl \
    || pip install flash-attn --no-build-isolation

# Clone YuE repository
WORKDIR /app
RUN git clone https://github.com/multimodal-art-projection/YuE.git

# Install YuE requirements
WORKDIR /app/YuE
RUN pip install --no-cache-dir -r requirements.txt || echo "Some YuE deps may have failed"

# 3. Clone xcodec WITH LFS
WORKDIR /app/YuE/inference
RUN git clone https://huggingface.co/m-a-p/xcodec_mini_infer && \
    cd xcodec_mini_infer && \
    git lfs pull

# Copy handler
WORKDIR /workspace
COPY handler.py /workspace/handler.py

# Environment variables
ENV TRANSFORMERS_CACHE=/workspace/.cache
ENV HF_HOME=/workspace/.cache
ENV PYTHONUNBUFFERED=1

# Start handler
CMD ["python", "-u", "/workspace/handler.py"]