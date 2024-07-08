resource "aws_lambda_function" "upload_url_generator" {
  function_name = "${local.project}-upload-url-generator"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.upload_url_generator_role.arn
  filename      = data.archive_file.lambda.output_path

  source_code_hash = data.archive_file.lambda.output_base64sha256
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "upload_url_generator_role" {
  name               = "upload-url-generator-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/upload-url-generator/dist"
  output_path = "artifacts/upload-url-generator.zip"
}

resource "aws_iam_role_policy_attachment" "attachment" {
  role       = aws_iam_role.upload_url_generator_role.name
  policy_arn = aws_iam_policy.logs_policy.arn
}

resource "aws_iam_policy" "logs_policy" {
  name = "${local.project}-logs-policy"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:${local.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*:*:*"
    }
  ]
}
EOF
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_url_generator.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
