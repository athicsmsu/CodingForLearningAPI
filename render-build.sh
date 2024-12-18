#!/bin/bash
echo "Installing OpenJDK..."
# curl https://download.java.net/java/ga/jdk11/openjdk-11_osx-x64_bin.tar.gz \
#  | tar -xz \
# && sudo mv jdk-11.jdk /Library/Java/JavaVirtualMachines

curl https://download.java.net/java/ga/jdk11/openjdk-11_osx-x64_bin.tar.gz 
# \ |  \
#  && 
tar -xz
mv jdk-11.jdk java
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
