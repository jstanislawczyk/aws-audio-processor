provider "aws" {
  region = local.region

  default_tags {
    tags = {
      Owner = "jstanislawczyk"
      Name  = "AudioProcessor"
    }
  }
}
