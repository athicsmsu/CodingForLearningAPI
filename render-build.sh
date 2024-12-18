#!/bin/bash
echo "Installing OpenJDK..."
curl -L -o openjdk.tar.gz https://download.java.net/java/GA/jdk11/13/GPL/openjdk-11_linux-x64_bin.tar.gz

# ตรวจสอบว่าการดาวน์โหลดสำเร็จ
if [ ! -f openjdk.tar.gz ]; then
  echo "Failed to download OpenJDK!"
  exit 1
fi

# Extract
mkdir -p jdk
tar -xzf openjdk.tar.gz -C jdk --strip-components=1
export JAVA_HOME=$PWD/jdk
export PATH=$JAVA_HOME/bin:$PATH

# ตรวจสอบว่า Java ติดตั้งสำเร็จ
echo "Java version:"
java -version || {
  echo "Java not found. Exiting."
  exit 1
}

echo "Running yarn build..."
yarn
