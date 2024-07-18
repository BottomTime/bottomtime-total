resource "tls_private_key" "web_rsa_key" {
  algorithm = "RSA"
  rsa_bits  = 2048
}
