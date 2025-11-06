#!/bin/bash

# Oysterette Pre-Build Workflow
# This script runs before building to ensure code quality and minimize bundle size
# Usage: ./pre-build.sh [mobile|backend|all]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Determine what to build
BUILD_TARGET=${1:-all}

# Function to run depcheck and show results
run_depcheck() {
    local dir=$1
    local name=$2

    print_header "Running depcheck for $name"
    cd "$dir"

    if npm run depcheck > /tmp/depcheck-$name.log 2>&1; then
        print_success "No unused dependencies found in $name"
    else
        print_warning "Found unused dependencies in $name:"
        cat /tmp/depcheck-$name.log
        echo ""
        echo -e "${YELLOW}Consider running:${NC}"
        echo "  cd $dir"
        echo "  npm uninstall <package-name>"
        echo ""
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Build cancelled"
            exit 1
        fi
    fi
}

# Function to run tests
run_tests() {
    print_header "Running Backend Tests"
    cd backend

    if npm test; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
}

# Main workflow
print_header "Oysterette Pre-Build Workflow"
echo "Target: $BUILD_TARGET"
echo ""

# Step 1: Run depcheck
if [[ "$BUILD_TARGET" == "backend" ]] || [[ "$BUILD_TARGET" == "all" ]]; then
    run_depcheck "backend" "Backend"
fi

if [[ "$BUILD_TARGET" == "mobile" ]] || [[ "$BUILD_TARGET" == "all" ]]; then
    run_depcheck "mobile-app" "Mobile App"
fi

# Step 2: Run tests (backend only)
if [[ "$BUILD_TARGET" == "backend" ]] || [[ "$BUILD_TARGET" == "all" ]]; then
    cd /Users/garzamacbookair/projects/claude-project
    run_tests
fi

# Step 3: Git status check
print_header "Git Status Check"
cd /Users/garzamacbookair/projects/claude-project
if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes:"
    git status -s
    echo ""
    read -p "Would you like to commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
        print_success "Changes committed"

        read -p "Push to GitHub? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            print_success "Pushed to GitHub"
        fi
    fi
else
    print_success "No uncommitted changes"
fi

# Step 4: Ready to build
print_header "Pre-Build Checks Complete"
print_success "All checks passed! Ready to build."
echo ""
echo "Next steps:"
if [[ "$BUILD_TARGET" == "mobile" ]]; then
    echo "  Mobile App:"
    echo "    - For APK build: cd mobile-app && eas build --platform android --profile preview"
    echo "    - For OTA update: cd mobile-app && npm run deploy-update \"Your update message\""
elif [[ "$BUILD_TARGET" == "backend" ]]; then
    echo "  Backend:"
    echo "    - cd backend && npm run build"
    echo "    - Deploy will happen automatically via Railway"
else
    echo "  Mobile App:"
    echo "    - cd mobile-app && eas build --platform android --profile preview"
    echo "  Backend:"
    echo "    - cd backend && npm run build"
fi
echo ""
