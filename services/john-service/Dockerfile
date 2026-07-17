# John the Ripper (jumbo) + a small FastAPI wrapper for zip password recovery.
# Jumbo build is required for zip2john. Builds from source for a reliable,
# up-to-date jumbo with the *2john tools.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
      git build-essential libssl-dev zlib1g-dev yasm libgmp-dev \
      libpcap-dev libbz2-dev pkg-config ca-certificates \
      python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

# Build John the Ripper jumbo from source -> binaries land in /opt/john/run
RUN git clone --depth 1 https://github.com/openwall/john -b bleeding-jumbo /opt/john \
  && cd /opt/john/src \
  && ./configure \
  && make -sj"$(nproc)" \
  && rm -rf /opt/john/.git

ENV PATH="/opt/john/run:${PATH}"

WORKDIR /app
COPY requirements.txt .
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt
COPY server.py .

EXPOSE 8080
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
